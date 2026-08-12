import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { firmarPasoIntermedio, firmarToken } from '../lib/jwt.js';
import { aUsuarioPublico } from '../lib/usuarioPublico.js';
import { conflicto, demasiadosIntentos, noAutorizado, noEncontrado } from '../lib/errores.js';
import { anotarFallo, limpiarFallos, revisarFreno } from '../lib/intentosDeEntrada.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { esquemaActualizarPerfil, esquemaLogin, esquemaRegistro } from '../schemas/auth.js';
import { correoConfigurado, correoDeVerificacion, enviarCorreo } from '../lib/correo.js';
import { crearToken } from '../lib/tokens.js';
import { origenesPermitidos } from '../lib/env.js';

export const rutasAuth = Router();

/**
 * Freno por conexion. Solo cuentan los intentos fallidos: en el wifi de la
 * universidad muchos estudiantes comparten la misma direccion IP, asi que
 * castigar los inicios de sesion correctos dejaria por fuera a medio campus.
 *
 * El tope es holgado porque el trabajo fino lo hace el freno por cuenta, que
 * protege cada cuenta por separado. Este de aqui solo esta para cortar a un
 * script que dispara miles de intentos desde una misma conexion, sin que un
 * salon entero quede bloqueado por culpa de uno.
 */
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos fallidos desde esta conexión. Espera quince minutos.',
  },
});

/**
 * Frena el registro masivo automatizado, no a los estudiantes.
 *
 * El tope es alto a proposito. Al empezar el semestre puede correrse la voz y
 * registrarse un salon entero desde el wifi de la universidad, donde todos
 * salen con la misma direccion. Con un tope bajo, a partir de cierto numero
 * nadie mas podria crear cuenta, y ni ellos ni nosotros entenderiamos por que.
 *
 * Cien por hora sigue cortando a un script que crea miles, que es lo que
 * de verdad hay que evitar.
 */
const limitadorRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Se crearon demasiadas cuentas desde esta conexion. Intenta mas tarde.',
  },
});

rutasAuth.post(
  '/registro',
  limitadorRegistro,
  asincrono(async (req, res) => {
    const datos = esquemaRegistro.parse(req.body);

    const existente = await prisma.usuario.findUnique({ where: { email: datos.email } });
    if (existente) throw conflicto('Ya hay una cuenta con ese correo. Inicia sesión.');

    const passwordHash = await bcrypt.hash(datos.password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono ?? null,
        passwordHash,
        rol: datos.rol,
      },
    });

    // El correo de confirmacion se manda pero no se espera: si el servicio esta
    // caido, la persona igual queda registrada y puede pedirlo despues.
    if (correoConfigurado) {
      void crearToken(usuario.id, 'VERIFICAR_CORREO')
        .then((codigo) => {
          const base = origenesPermitidos[0] ?? 'http://localhost:5173';
          return enviarCorreo(
            correoDeVerificacion(
              usuario.email,
              usuario.nombre.split(' ')[0],
              `${base}/confirmar-correo?token=${codigo}`,
            ),
          );
        })
        .catch(() => {
          process.stderr.write('[PamploHogar] No se pudo enviar el correo de bienvenida.\n');
        });
    }

    const token = firmarToken({ sub: usuario.id, rol: usuario.rol });
    res.status(201).json({ token, usuario: aUsuarioPublico(usuario) });
  }),
);

rutasAuth.post(
  '/login',
  limitadorLogin,
  asincrono(async (req, res) => {
    const datos = esquemaLogin.parse(req.body);

    const usuario = await prisma.usuario.findUnique({ where: { email: datos.email } });
    if (!usuario) throw noAutorizado('Correo o contraseña incorrectos.');

    const freno = revisarFreno(usuario.bloqueadoHasta, new Date());
    if (freno.frenada) {
      // Decir que la cuenta esta frenada confirma que ese correo existe, pero
      // el registro ya lo confirma al responder "ya hay una cuenta con ese
      // correo". Callarlo aqui solo confundiria a quien si es el dueno.
      throw demasiadosIntentos(
        `Demasiados intentos con este correo. Espera ${freno.minutosQueFaltan} ` +
          `${freno.minutosQueFaltan === 1 ? 'minuto' : 'minutos'}, o cambia tu contraseña ` +
          'desde "Olvidé mi contraseña" y entras de una vez.',
      );
    }

    const coincide = await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!coincide) {
      await anotarFallo(usuario.id, usuario.intentosFallidos);
      throw noAutorizado('Correo o contraseña incorrectos.');
    }

    // Con verificacion en dos pasos, la contrasena correcta todavia no abre
    // nada: solo da un pase de cinco minutos para escribir el codigo. El
    // contador de fallos se limpia hasta que termine de entrar, no antes.
    if (usuario.dobleFactorActivadoEn !== null) {
      res.json({
        requiereCodigo: true,
        paseIntermedio: firmarPasoIntermedio(usuario.id),
      });
      return;
    }

    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta !== null) {
      await limpiarFallos(usuario.id);
    }

    const token = firmarToken({ sub: usuario.id, rol: usuario.rol });
    res.json({ token, usuario: aUsuarioPublico(usuario) });
  }),
);

rutasAuth.get(
  '/yo',
  requiereSesion,
  asincrono(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw noEncontrado('Tu cuenta ya no existe.');
    res.json({ usuario: aUsuarioPublico(usuario) });
  }),
);

rutasAuth.patch(
  '/yo',
  requiereSesion,
  asincrono(async (req, res) => {
    const datos = esquemaActualizarPerfil.parse(req.body);
    const usuario = await prisma.usuario.update({
      where: { id: req.usuario!.sub },
      data: {
        ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
        ...(datos.telefono !== undefined ? { telefono: datos.telefono } : {}),
      },
    });
    res.json({ usuario: aUsuarioPublico(usuario) });
  }),
);
