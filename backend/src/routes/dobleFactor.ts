import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { demasiadosIntentos, noAutorizado, solicitudInvalida } from '../lib/errores.js';
import { firmarToken, verificarPasoIntermedio } from '../lib/jwt.js';
import { aUsuarioPublico } from '../lib/usuarioPublico.js';
import {
  claveLegible,
  claveNueva,
  codigosDeRespaldo,
  direccionParaLaApp,
  revisarCodigo,
} from '../lib/dobleFactor.js';
import { anotarFallo, limpiarFallos, revisarFreno } from '../lib/intentosDeEntrada.js';
import {
  esquemaActivarDobleFactor,
  esquemaApagarDobleFactor,
  esquemaCodigoDeEntrada,
  esquemaPrepararDobleFactor,
} from '../schemas/dobleFactor.js';
import {
  gastarCodigo,
  mandarCodigo,
  revisarCodigoDeCorreo,
} from '../lib/codigoPorCorreo.js';
import { correoConfigurado } from '../lib/correo.js';

export const rutasDobleFactor = Router();

/**
 * Frena a quien pruebe codigos al azar desde una misma conexion.
 *
 * El tope es holgado a proposito, igual que en el inicio de sesion: en el wifi
 * de la universidad todos comparten una sola direccion, y con un tope bajo una
 * persona equivocandose dejaria a todo el salon sin poder entrar. El trabajo
 * fino lo hace el freno por cuenta, que frena solo la cuenta que se esta
 * atacando.
 */
const limitadorPorConexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados códigos fallidos desde esta conexión. Espera quince minutos.' },
});

/**
 * Configurar o quitar la verificacion exige tener la sesion abierta, asi que
 * abusar de esto ya cuesta una cuenta. Con un tope mas bajo alcanza.
 */
const limitadorDeAjustes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espera quince minutos.' },
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
      select: { dobleFactorActivadoEn: true, metodoDobleFactor: true },
    });

    const respaldos = await prisma.codigoRespaldo.count({
      where: { usuarioId: req.usuario!.sub, usadoEn: null },
    });

    res.json({
      activada: usuario?.dobleFactorActivadoEn != null,
      metodo: usuario?.metodoDobleFactor ?? 'APP',
      correoDisponible: correoConfigurado,
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
    const { metodo } = esquemaPrepararDobleFactor.parse(req.body);

    if (metodo === 'CORREO') {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { metodoDobleFactor: 'CORREO', dobleFactorClave: null, dobleFactorUltimoPaso: null },
      });

      // Se manda un codigo de prueba de una. Si no llega, la verificacion no
      // se activa: asi nadie queda encerrado fuera de su propia cuenta por
      // confiar en un correo que nunca iba a salir.
      const salio = await mandarCodigo(usuario.id);
      if (!salio) {
        throw solicitudInvalida(
          'No pudimos enviarte el correo de prueba, así que no activamos nada. ' +
            'Usa la app de autenticación mientras tanto.',
        );
      }

      res.json({ metodo: 'CORREO', correoEnviadoA: usuario.email });
      return;
    }

    const clave = claveNueva();
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { metodoDobleFactor: 'APP', dobleFactorClave: clave, dobleFactorUltimoPaso: null },
    });

    res.json({
      metodo: 'APP',
      direccionParaLaApp: direccionParaLaApp(clave, usuario.email),
      claveParaEscribir: claveLegible(clave),
    });
  }),
);

/** Segundo paso: escribe un codigo de la app y queda activada. */
rutasDobleFactor.post(
  '/doble-factor/activar',
  requiereSesion,
  limitadorDeAjustes,
  asincrono(async (req, res) => {
    const datos = esquemaActivarDobleFactor.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw noAutorizado('Tu cuenta ya no existe.');
    if (usuario.dobleFactorActivadoEn !== null) {
      throw solicitudInvalida('Ya tienes la verificación activada.');
    }
    let paso: number | null = null;

    if (usuario.metodoDobleFactor === 'CORREO') {
      const r = revisarCodigoDeCorreo(
        usuario.codigoCorreoHash,
        usuario.codigoCorreoExpira,
        datos.codigo,
        new Date(),
      );
      if (r === 'vencido') {
        throw solicitudInvalida('Ese código ya venció. Pide uno nuevo.');
      }
      if (r !== 'bueno') {
        throw solicitudInvalida('Ese código no es correcto. Revisa el correo que te llegó.');
      }
      await gastarCodigo(usuario.id);
    } else {
      if (usuario.dobleFactorClave === null) {
        throw solicitudInvalida('Primero configura la app de autenticación.');
      }
      const revision = revisarCodigo(usuario.dobleFactorClave, datos.codigo, new Date(), null);
      if (revision.estado !== 'bueno') {
        throw solicitudInvalida('Ese código no es correcto. Revisa la app e intenta de nuevo.');
      }
      paso = revision.paso;
    }

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
  limitadorDeAjustes,
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
          metodoDobleFactor: 'APP',
          codigoCorreoHash: null,
          codigoCorreoExpira: null,
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
  limitadorPorConexion,
  asincrono(async (req, res) => {
    const datos = esquemaCodigoDeEntrada.parse(req.body);

    const usuarioId = verificarPasoIntermedio(datos.paseIntermedio);
    if (usuarioId === null) {
      throw noAutorizado('Se venció el tiempo. Vuelve a escribir tu correo y contraseña.');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.dobleFactorActivadoEn === null) {
      throw noAutorizado('Vuelve a escribir tu correo y contraseña.');
    }

    const freno = revisarFreno(usuario.bloqueadoHasta, new Date());
    if (freno.frenada) {
      throw demasiadosIntentos(
        `Demasiados códigos fallidos con esta cuenta. Espera ${freno.minutosQueFaltan} ` +
          `${freno.minutosQueFaltan === 1 ? 'minuto' : 'minutos'}.`,
      );
    }

    // Por correo el camino es otro: no hay app ni ventanas de treinta segundos.
    if (usuario.metodoDobleFactor === 'CORREO') {
      const r = revisarCodigoDeCorreo(
        usuario.codigoCorreoHash,
        usuario.codigoCorreoExpira,
        datos.codigo,
        new Date(),
      );

      if (r === 'bueno') {
        await gastarCodigo(usuario.id);
        await limpiarFallos(usuario.id);
        res.json({
          token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
          usuario: aUsuarioPublico(usuario),
        });
        return;
      }

      if (r === 'vencido') {
        throw noAutorizado('Ese código ya venció. Pide uno nuevo y revisa tu correo.');
      }

      const deRespaldo = await prisma.codigoRespaldo.findFirst({
        where: { usuarioId: usuario.id, usadoEn: null, hash: resumir(datos.codigo) },
      });
      if (deRespaldo === null) {
        await anotarFallo(usuario.id, usuario.intentosFallidos);
        throw noAutorizado('Ese código no es correcto.');
      }

      await prisma.codigoRespaldo.update({
        where: { id: deRespaldo.id },
        data: { usadoEn: new Date() },
      });
      await limpiarFallos(usuario.id);
      const quedanRespaldos = await prisma.codigoRespaldo.count({
        where: { usuarioId: usuario.id, usadoEn: null },
      });
      res.json({
        token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
        usuario: aUsuarioPublico(usuario),
        usoCodigoDeRespaldo: true,
        codigosDeRespaldoSinUsar: quedanRespaldos,
      });
      return;
    }

    // Aqui abajo ya solo queda el metodo de app, que si necesita la clave.
    const claveDeLaApp = usuario.dobleFactorClave;
    if (claveDeLaApp === null) {
      throw noAutorizado('Vuelve a escribir tu correo y contraseña.');
    }

    const revision = revisarCodigo(
      claveDeLaApp,
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
      // Ni de la app ni de respaldo: cuenta como intento fallido de la cuenta.
      await anotarFallo(usuario.id, usuario.intentosFallidos);
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

/** Para cuando el correo se demora, se borra por error o vence. */
rutasDobleFactor.post(
  '/login/codigo/reenviar',
  limitadorPorConexion,
  asincrono(async (req, res) => {
    const pase = typeof req.body?.paseIntermedio === 'string' ? req.body.paseIntermedio : '';
    const usuarioId = verificarPasoIntermedio(pase);
    if (usuarioId === null) {
      throw noAutorizado('Se venció el tiempo. Vuelve a escribir tu correo y contraseña.');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { metodoDobleFactor: true, dobleFactorActivadoEn: true },
    });
    if (!usuario || usuario.dobleFactorActivadoEn === null) {
      throw noAutorizado('Vuelve a escribir tu correo y contraseña.');
    }
    if (usuario.metodoDobleFactor !== 'CORREO') {
      throw solicitudInvalida('Tu cuenta usa la app de autenticación, no el correo.');
    }

    const salio = await mandarCodigo(usuarioId);
    res.json({ enviado: salio });
  }),
);
