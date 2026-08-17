import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { firmarPasoIntermedio, firmarToken } from '../lib/jwt.js';
import { mandarCodigo } from '../lib/codigoPorCorreo.js';
import { googleConfigurado, personaDeGoogle } from '../lib/google.js';
import { randomBytes } from 'node:crypto';
import { aUsuarioPublico } from '../lib/usuarioPublico.js';
import {
  conflicto,
  demasiadosIntentos,
  noAutorizado,
  noEncontrado,
  solicitudInvalida,
} from '../lib/errores.js';
import { anotarFallo, limpiarFallos, revisarFreno } from '../lib/intentosDeEntrada.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { esquemaActualizarPerfil, esquemaLogin, esquemaRegistro } from '../schemas/auth.js';
import { correoConfigurado, correoDeVerificacion, enviarCorreo } from '../lib/correo.js';
import { crearToken } from '../lib/tokens.js';
import { env, origenesPermitidos } from '../lib/env.js';

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
 * Eran cien por hora y se quedaron cortas. La prueba de carga del 15 de agosto
 * de 2026 lo dejo ver: desde una sola conexion, la cuenta numero ciento uno ya
 * no entra y tiene que esperar una hora sin entender por que. En el campus todo
 * el mundo sale por la misma direccion, asi que eso es media jornada de
 * matriculas frenada.
 *
 * Trescientas por hora siguen cortando a un script que crea miles, que es lo
 * que de verdad hay que evitar, y ya no alcanzan a frenar a una cohorte que se
 * registra el mismo dia.
 */
const limitadorRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Se crearon demasiadas cuentas desde esta conexión. Intenta más tarde.',
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
        telefono: datos.telefono || null,
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
      // Con el metodo de correo hay que mandar el codigo ahora. Si el envio
      // falla se dice, en vez de dejar a la persona esperando un correo que
      // nunca va a llegar.
      const porCorreo = usuario.metodoDobleFactor === 'CORREO';
      const salio = porCorreo ? await mandarCodigo(usuario.id) : true;

      res.json({
        requiereCodigo: true,
        metodo: usuario.metodoDobleFactor,
        paseIntermedio: firmarPasoIntermedio(usuario.id),
        ...(porCorreo ? { correoEnviado: salio } : {}),
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

/** Si el boton de Google esta encendido. La pagina lo consulta al cargar. */
rutasAuth.get('/google/estado', (_req, res) => {
  res.json({ disponible: googleConfigurado, clienteId: env.GOOGLE_CLIENT_ID });
});

/**
 * Entrar con la cuenta de Google.
 *
 * Sirve para entrar y para crear la cuenta: si el correo no existe todavia se
 * crea como estudiante, que es lo que va a ser casi todo el que llegue por
 * aqui. Un arrendador puede cambiar despues, o registrarse por el camino
 * normal si prefiere.
 */
rutasAuth.post(
  '/google',
  limitadorLogin,
  asincrono(async (req, res) => {
    if (!googleConfigurado) {
      throw solicitudInvalida('Entrar con Google no está disponible por ahora.');
    }

    const credencial = typeof req.body?.credencial === 'string' ? req.body.credencial : '';
    if (credencial === '') throw solicitudInvalida('Falta la credencial de Google.');

    const persona = await personaDeGoogle(credencial);
    if (persona === null) {
      throw noAutorizado('No pudimos comprobar tu cuenta de Google. Intenta de nuevo.');
    }

    const existente = await prisma.usuario.findUnique({ where: { email: persona.email } });

    if (existente !== null) {
      const freno = revisarFreno(existente.bloqueadoHasta, new Date());
      if (freno.frenada) {
        throw demasiadosIntentos(
          `Esta cuenta está frenada. Espera ${freno.minutosQueFaltan} ` +
            `${freno.minutosQueFaltan === 1 ? 'minuto' : 'minutos'}.`,
        );
      }

      // Con verificacion en dos pasos activada, entrar con Google tampoco se
      // la salta. Si no, activarla no serviria de nada: bastaria con tener el
      // Google de la persona abierto.
      if (existente.dobleFactorActivadoEn !== null) {
        const porCorreo = existente.metodoDobleFactor === 'CORREO';
        const salio = porCorreo ? await mandarCodigo(existente.id) : true;
        res.json({
          requiereCodigo: true,
          metodo: existente.metodoDobleFactor,
          paseIntermedio: firmarPasoIntermedio(existente.id),
          ...(porCorreo ? { correoEnviado: salio } : {}),
        });
        return;
      }

      // Google ya confirmo que ese correo es suyo, asi que la insignia de
      // correo confirmado se puede dar sin mandar nada.
      const actualizado =
        existente.emailVerificadoEn === null
          ? await prisma.usuario.update({
              where: { id: existente.id },
              data: { emailVerificadoEn: new Date(), intentosFallidos: 0, bloqueadoHasta: null },
            })
          : existente;

      res.json({
        token: firmarToken({ sub: actualizado.id, rol: actualizado.rol }),
        usuario: aUsuarioPublico(actualizado),
      });
      return;
    }

    // Cuenta nueva. No hay contrasena, asi que se guarda un hash de algo que
    // nadie sabe: la cuenta solo se abre por Google o pidiendo contrasena
    // nueva desde "Olvide mi contrasena".
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: persona.nombre.slice(0, 80),
        email: persona.email,
        passwordHash,
        rol: 'ESTUDIANTE',
        emailVerificadoEn: new Date(),
      },
    });

    res.status(201).json({
      token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
      usuario: aUsuarioPublico(usuario),
      cuentaNueva: true,
    });
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
        // Cadena vacia quiere decir quitarlo, no dejarlo en blanco.
        ...(datos.telefono !== undefined ? { telefono: datos.telefono || null } : {}),
        ...(datos.descripcion !== undefined ? { descripcion: datos.descripcion || null } : {}),
        ...(datos.foto !== undefined ? { foto: datos.foto || null } : {}),
        ...(datos.fotoId !== undefined ? { fotoId: datos.fotoId || null } : {}),
      },
    });
    res.json({ usuario: aUsuarioPublico(usuario) });
  }),
);
