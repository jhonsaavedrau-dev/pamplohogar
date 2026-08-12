import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { noAutorizado, solicitudInvalida } from '../lib/errores.js';
import { firmarToken, verificarPasoIntermedio } from '../lib/jwt.js';
import { aUsuarioPublico } from '../lib/usuarioPublico.js';
import {
  claveLegible,
  claveNueva,
  codigosDeRespaldo,
  direccionParaLaApp,
  revisarCodigo,
} from '../lib/dobleFactor.js';
import { limpiarFallos } from '../lib/intentosDeEntrada.js';
import {
  esquemaActivarDobleFactor,
  esquemaApagarDobleFactor,
  esquemaCodigoDeEntrada,
} from '../schemas/dobleFactor.js';

export const rutasDobleFactor = Router();

/**
 * Frena a quien pruebe codigos al azar.
 *
 * Son un millon de combinaciones y cada una vale treinta segundos. Con veinte
 * intentos cada quince minutos, adivinar uno llevaria siglos, y a quien de
 * verdad esta entrando le sobran veinte intentos para copiar bien seis
 * digitos.
 */
const limitadorCodigo = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados códigos fallidos. Espera quince minutos.' },
});

const resumir = (codigo: string): string =>
  createHash('sha256').update(codigo.toUpperCase().replace(/\s/g, '')).digest('hex');

/** Como va la verificacion en dos pasos de quien tiene la sesion abierta. */
rutasDobleFactor.get(
  '/doble-factor',
  requiereSesion,
  asincrono(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario!.sub },
      select: { dobleFactorActivadoEn: true },
    });

    const respaldos = await prisma.codigoRespaldo.count({
      where: { usuarioId: req.usuario!.sub, usadoEn: null },
    });

    res.json({
      activada: usuario?.dobleFactorActivadoEn != null,
      desde: usuario?.dobleFactorActivadoEn ?? null,
      codigosDeRespaldoSinUsar: respaldos,
    });
  }),
);

/** Primer paso: se genera la clave y se muestra para configurar la app. */
rutasDobleFactor.post(
  '/doble-factor/preparar',
  requiereSesion,
  asincrono(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw noAutorizado('Tu cuenta ya no existe.');
    if (usuario.dobleFactorActivadoEn !== null) {
      throw solicitudInvalida('Ya tienes la verificación activada.');
    }

    // Se genera una clave nueva cada vez que se prepara. Si alguien empezo y
    // dejo la pantalla a medias, la clave vieja deja de servir.
    const clave = claveNueva();
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { dobleFactorClave: clave, dobleFactorUltimoPaso: null },
    });

    res.json({
      direccionParaLaApp: direccionParaLaApp(clave, usuario.email),
      claveParaEscribir: claveLegible(clave),
    });
  }),
);

/** Segundo paso: escribe un codigo de la app y queda activada. */
rutasDobleFactor.post(
  '/doble-factor/activar',
  requiereSesion,
  limitadorCodigo,
  asincrono(async (req, res) => {
    const datos = esquemaActivarDobleFactor.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw noAutorizado('Tu cuenta ya no existe.');
    if (usuario.dobleFactorActivadoEn !== null) {
      throw solicitudInvalida('Ya tienes la verificación activada.');
    }
    if (usuario.dobleFactorClave === null) {
      throw solicitudInvalida('Primero configura la app de autenticación.');
    }

    const revision = revisarCodigo(usuario.dobleFactorClave, datos.codigo, new Date(), null);
    if (revision.estado !== 'bueno') {
      throw solicitudInvalida('Ese código no es correcto. Revisa la app e intenta de nuevo.');
    }
    const paso = revision.paso;

    const codigos = codigosDeRespaldo();

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: usuario.id },
        data: { dobleFactorActivadoEn: new Date(), dobleFactorUltimoPaso: paso },
      }),
      prisma.codigoRespaldo.deleteMany({ where: { usuarioId: usuario.id } }),
      prisma.codigoRespaldo.createMany({
        data: codigos.map((c) => ({ usuarioId: usuario.id, hash: resumir(c) })),
      }),
    ]);

    // Es la unica vez que se ven. Despues solo queda el resumen.
    res.json({ codigosDeRespaldo: codigos });
  }),
);

/** Apagarla exige la contrasena, para que no baste con un celular prestado. */
rutasDobleFactor.post(
  '/doble-factor/apagar',
  requiereSesion,
  limitadorCodigo,
  asincrono(async (req, res) => {
    const datos = esquemaApagarDobleFactor.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw noAutorizado('Tu cuenta ya no existe.');

    const coincide = await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!coincide) throw solicitudInvalida('Esa no es tu contraseña.');

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          dobleFactorClave: null,
          dobleFactorActivadoEn: null,
          dobleFactorUltimoPaso: null,
        },
      }),
      prisma.codigoRespaldo.deleteMany({ where: { usuarioId: usuario.id } }),
    ]);

    res.json({ mensaje: 'Verificación en dos pasos desactivada.' });
  }),
);

/** Segundo tramo del inicio de sesion: el codigo de la app o uno de respaldo. */
rutasDobleFactor.post(
  '/login/codigo',
  limitadorCodigo,
  asincrono(async (req, res) => {
    const datos = esquemaCodigoDeEntrada.parse(req.body);

    const usuarioId = verificarPasoIntermedio(datos.paseIntermedio);
    if (usuarioId === null) {
      throw noAutorizado('Se venció el tiempo. Vuelve a escribir tu correo y contraseña.');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.dobleFactorActivadoEn === null || usuario.dobleFactorClave === null) {
      throw noAutorizado('Vuelve a escribir tu correo y contraseña.');
    }

    const revision = revisarCodigo(
      usuario.dobleFactorClave,
      datos.codigo,
      new Date(),
      usuario.dobleFactorUltimoPaso,
    );

    if (revision.estado === 'yaUsado') {
      throw noAutorizado(
        'Ese código ya lo usaste. Espera a que la app te muestre el siguiente y escribe ese.',
      );
    }

    if (revision.estado === 'bueno') {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { dobleFactorUltimoPaso: revision.paso },
      });
      await limpiarFallos(usuario.id);
      res.json({ token: firmarToken({ sub: usuario.id, rol: usuario.rol }), usuario: aUsuarioPublico(usuario) });
      return;
    }

    // Si no era de la app, puede ser uno de respaldo. Se buscan por resumen,
    // igual que las contrasenas: en la base nunca hay uno legible.
    const respaldo = await prisma.codigoRespaldo.findFirst({
      where: { usuarioId: usuario.id, usadoEn: null, hash: resumir(datos.codigo) },
    });

    if (respaldo === null) {
      throw noAutorizado('Ese código no es correcto.');
    }

    await prisma.codigoRespaldo.update({
      where: { id: respaldo.id },
      data: { usadoEn: new Date() },
    });
    await limpiarFallos(usuario.id);

    const quedan = await prisma.codigoRespaldo.count({
      where: { usuarioId: usuario.id, usadoEn: null },
    });

    res.json({
      token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
      usuario: aUsuarioPublico(usuario),
      usoCodigoDeRespaldo: true,
      codigosDeRespaldoSinUsar: quedan,
    });
  }),
);
