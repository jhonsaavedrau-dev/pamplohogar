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

export const rutasAuth = Router();

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' },
});

rutasAuth.post(
  '/registro',
  limitador,
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

    const token = firmarToken({ sub: usuario.id, rol: usuario.rol });
    res.status(201).json({ token, usuario: aUsuarioPublico(usuario) });
  }),
);

rutasAuth.post(
  '/login',
  limitador,
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
