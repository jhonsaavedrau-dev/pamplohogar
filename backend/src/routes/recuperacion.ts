import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { solicitudInvalida } from '../lib/errores.js';
import { origenesPermitidos } from '../lib/env.js';
import {
  correoConfigurado,
  correoDeRecuperacion,
  correoDeVerificacion,
  enviarCorreo,
} from '../lib/correo.js';
import { crearToken, validarToken } from '../lib/tokens.js';
import {
  esquemaConfirmarCorreo,
  esquemaPedirRecuperacion,
  esquemaRestablecerClave,
} from '../schemas/auth.js';

export const rutasRecuperacion = Router();

/**
 * Envio de correos: se limita porque cada uno cuesta y podria usarse para
 * llenarle la bandeja a alguien. El tope es generoso porque en el wifi de la
 * universidad todos los estudiantes salen con la misma direccion.
 */
const limitadorEnvio = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Pediste demasiados correos seguidos. Espera un rato y vuelve a intentarlo.',
  },
});

/**
 * Canje del enlace: solo cuentan los intentos fallidos.
 *
 * Cambiar la contrasena con un enlace valido no es un ataque; adivinar
 * enlaces si. Contar los aciertos dejaria por fuera a quien de verdad esta
 * recuperando su cuenta desde una conexion compartida.
 *
 * El tope no es lo que hace seguro el enlace: son 32 bytes al azar y no se
 * adivinan por fuerza bruta ni en millones de anos. Esto solo evita que
 * alguien nos tenga el servidor ocupado probando.
 */
const limitadorCanje = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados enlaces invalidos. Espera un rato y pide uno nuevo.',
  },
});

const baseDelSitio = (): string => origenesPermitidos[0] ?? 'http://localhost:5173';

/**
 * Pide el enlace para cambiar la contrasena.
 *
 * Siempre responde lo mismo, exista o no la cuenta. Si dijera "ese correo no
 * esta registrado", cualquiera podria averiguar quien tiene cuenta aqui.
 */
rutasRecuperacion.post(
  '/recuperar',
  limitadorEnvio,
  asincrono(async (req, res) => {
    const { email } = esquemaPedirRecuperacion.parse(req.body);

    const respuestaNeutral = {
      mensaje:
        'Si ese correo tiene una cuenta, ya le enviamos el enlace para cambiar la contrasena. Revisa tambien la carpeta de spam.',
    };

    if (!correoConfigurado) {
      throw solicitudInvalida(
        'Todavia no podemos enviar correos. Escribenos y te ayudamos a entrar a tu cuenta.',
      );
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      res.json(respuestaNeutral);
      return;
    }

    const token = await crearToken(usuario.id, 'RECUPERAR_CLAVE');
    const enlace = `${baseDelSitio()}/cambiar-clave?token=${token}`;

    await enviarCorreo(correoDeRecuperacion(usuario.email, usuario.nombre.split(' ')[0], enlace));

    res.json(respuestaNeutral);
  }),
);

/** Cambia la contrasena usando el enlace del correo. */
rutasRecuperacion.post(
  '/restablecer',
  limitadorCanje,
  asincrono(async (req, res) => {
    const datos = esquemaRestablecerClave.parse(req.body);

    const token = await validarToken(datos.token, 'RECUPERAR_CLAVE');
    if (!token) {
      throw solicitudInvalida(
        'Ese enlace ya no sirve: vencio o ya lo usaste. Pide uno nuevo desde la pantalla de entrar.',
      );
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: token.usuarioId }, data: { passwordHash } }),
      // Cambiar la clave invalida cualquier otro enlace pendiente.
      prisma.tokenCorreo.deleteMany({
        where: { usuarioId: token.usuarioId, tipo: 'RECUPERAR_CLAVE' },
      }),
    ]);

    res.json({ mensaje: 'Listo, tu contrasena quedo cambiada. Ya puedes entrar.' });
  }),
);

/** Reenvia el correo de confirmacion al usuario con sesion abierta. */
rutasRecuperacion.post(
  '/verificar/enviar',
  requiereSesion,
  limitadorEnvio,
  asincrono(async (req, res) => {
    if (!correoConfigurado) {
      throw solicitudInvalida('Todavia no podemos enviar correos. Intenta mas tarde.');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.sub } });
    if (!usuario) throw solicitudInvalida('Tu cuenta ya no existe.');

    if (usuario.emailVerificadoEn !== null) {
      res.json({ mensaje: 'Tu correo ya estaba confirmado.' });
      return;
    }

    const token = await crearToken(usuario.id, 'VERIFICAR_CORREO');
    const enlace = `${baseDelSitio()}/confirmar-correo?token=${token}`;

    const enviado = await enviarCorreo(
      correoDeVerificacion(usuario.email, usuario.nombre.split(' ')[0], enlace),
    );

    if (!enviado) {
      throw solicitudInvalida('No pudimos enviar el correo. Intenta de nuevo en unos minutos.');
    }

    res.json({ mensaje: `Te enviamos un correo a ${usuario.email}. Revisa tambien el spam.` });
  }),
);

/** Confirma el correo con el enlace recibido. */
rutasRecuperacion.post(
  '/verificar/confirmar',
  limitadorCanje,
  asincrono(async (req, res) => {
    const { token: codigo } = esquemaConfirmarCorreo.parse(req.body);

    const token = await validarToken(codigo, 'VERIFICAR_CORREO');
    if (!token) {
      throw solicitudInvalida(
        'Ese enlace ya no sirve: vencio o ya lo usaste. Entra a tu cuenta y pide uno nuevo.',
      );
    }

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: token.usuarioId },
        data: { emailVerificadoEn: new Date() },
      }),
      prisma.tokenCorreo.update({ where: { id: token.id }, data: { usadoEn: new Date() } }),
    ]);

    res.json({ mensaje: 'Correo confirmado. Gracias.' });
  }),
);
