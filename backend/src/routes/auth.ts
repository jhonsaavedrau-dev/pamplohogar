import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { firmarToken } from '../lib/jwt.js';
import { aUsuarioPublico } from '../lib/usuarioPublico.js';
import { conflicto, noAutorizado, noEncontrado } from '../lib/errores.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { esquemaActualizarPerfil, esquemaLogin, esquemaRegistro } from '../schemas/auth.js';
import { correoConfigurado, correoDeVerificacion, enviarCorreo } from '../lib/correo.js';
import { crearToken } from '../lib/tokens.js';
import { origenesPermitidos } from '../lib/env.js';

export const rutasAuth = Router();

/**
 * Solo cuentan los intentos fallidos.
 * En el wifi de la universidad muchos estudiantes comparten la misma direccion IP,
 * asi que castigar los inicios de sesion correctos dejaria por fuera a medio campus.
 * Lo que interesa frenar es a quien esta probando contrasenas a la fuerza.
 */
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos fallidos. Espera quince minutos y vuelve a probar.',
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
    if (existente) throw conflicto('Ya hay una cuenta con ese correo. Inicia sesion.');

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
    if (!usuario) throw noAutorizado('Correo o contrasena incorrectos.');

    const coincide = await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!coincide) throw noAutorizado('Correo o contrasena incorrectos.');

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
