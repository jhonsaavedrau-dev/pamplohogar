import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion } from '../middleware/auth.js';
import { noEncontrado, prohibido, solicitudInvalida } from '../lib/errores.js';
import { esquemaAbrirConversacion, esquemaEnviarMensaje } from '../schemas/mensaje.js';

export const rutasMensajes = Router();

/**
 * Frena a quien quiera usar el chat para inundar a un arrendador, sin
 * estorbarle a nadie que este conversando de verdad. Sesenta mensajes en diez
 * minutos son seis por minuto: mas rapido que eso ya no es una conversacion.
 */
const limitadorEnvio = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Estás enviando mensajes muy seguido. Espera un momento.' },
});

/**
 * Deja pasar solo a las dos personas del hilo.
 *
 * Un administrador tampoco entra: el chat entre dos personas no es material
 * de moderacion mientras nadie reporte nada, y darle esa llave al panel seria
 * abrir la correspondencia de todo el mundo por si acaso.
 */
async function conversacionDe(id: string, usuarioId: string) {
  const conversacion = await prisma.conversacion.findUnique({
    where: { id },
    include: {
      inmueble: { select: { id: true, titulo: true, precio: true, barrio: true } },
      estudiante: { select: { id: true, nombre: true } },
      arrendador: { select: { id: true, nombre: true } },
    },
  });
  if (!conversacion) throw noEncontrado('Esa conversación no existe.');
  if (conversacion.estudianteId !== usuarioId && conversacion.arrendadorId !== usuarioId) {
    throw prohibido('Esta conversación no es tuya.');
  }
  return conversacion;
}

/** El estudiante abre el hilo desde la ficha del inmueble. */
rutasMensajes.post(
  '/conversaciones',
  requiereSesion,
  requiereRol('ESTUDIANTE', 'ADMIN'),
  asincrono(async (req, res) => {
    const datos = esquemaAbrirConversacion.parse(req.body);

    const inmueble = await prisma.inmueble.findUnique({ where: { id: datos.inmuebleId } });
    if (!inmueble) throw noEncontrado('Ese inmueble ya no existe.');
    if (inmueble.arrendadorId === req.usuario!.sub) {
      throw solicitudInvalida('No puedes escribirte a ti mismo.');
    }
    if (!inmueble.activo) {
      throw solicitudInvalida('Esa publicación ya no está disponible.');
    }

    // Si ya existe el hilo se devuelve el mismo, no se crea otro: volver a la
    // ficha no puede borrar lo que ya se hablo.
    const conversacion = await prisma.conversacion.upsert({
      where: {
        inmuebleId_estudianteId: {
          inmuebleId: inmueble.id,
          estudianteId: req.usuario!.sub,
        },
      },
      create: {
        inmuebleId: inmueble.id,
        estudianteId: req.usuario!.sub,
        arrendadorId: inmueble.arrendadorId,
      },
      update: {},
    });

    res.status(201).json({ conversacionId: conversacion.id });
  }),
);

/** La bandeja de quien tiene la sesion abierta, sea estudiante o arrendador. */
rutasMensajes.get(
  '/conversaciones',
  requiereSesion,
  asincrono(async (req, res) => {
    const yo = req.usuario!.sub;

    const conversaciones = await prisma.conversacion.findMany({
      where: { OR: [{ estudianteId: yo }, { arrendadorId: yo }] },
      orderBy: { ultimoEn: 'desc' },
      take: 100,
      include: {
        inmueble: {
          select: {
            id: true,
            titulo: true,
            fotos: { select: { url: true }, orderBy: { orden: 'asc' }, take: 1 },
          },
        },
        estudiante: { select: { id: true, nombre: true } },
        arrendador: { select: { id: true, nombre: true } },
        mensajes: { orderBy: { creadoEn: 'desc' }, take: 1 },
        _count: {
          select: { mensajes: { where: { leidoEn: null, autorId: { not: yo } } } },
        },
      },
    });

    res.json({
      conversaciones: conversaciones.map((c) => {
        const otro = c.estudianteId === yo ? c.arrendador : c.estudiante;
        // La foto va tal cual: el navegador la pide al tamano que necesita
        // con las mismas ayudas que usa el resto de la pagina.
        const foto = c.inmueble.fotos[0]?.url ?? null;
        return {
          id: c.id,
          // Solo el nombre de pila, igual que en el resto de la plataforma.
          con: otro.nombre.split(' ')[0],
          inmuebleId: c.inmueble.id,
          inmuebleTitulo: c.inmueble.titulo,
          foto,
          ultimoMensaje: c.mensajes[0]?.texto ?? null,
          ultimoEn: c.ultimoEn,
          sinLeer: c._count.mensajes,
        };
      }),
    });
  }),
);

/** Cuantos mensajes sin leer hay, para el punto rojo del menu. */
rutasMensajes.get(
  '/mensajes/sin-leer',
  requiereSesion,
  asincrono(async (req, res) => {
    const yo = req.usuario!.sub;
    const sinLeer = await prisma.mensaje.count({
      where: {
        leidoEn: null,
        autorId: { not: yo },
        conversacion: { OR: [{ estudianteId: yo }, { arrendadorId: yo }] },
      },
    });
    res.json({ sinLeer });
  }),
);

/** Un hilo completo. Abrirlo marca como leidos los mensajes del otro. */
rutasMensajes.get(
  '/conversaciones/:id',
  requiereSesion,
  asincrono(async (req, res) => {
    const yo = req.usuario!.sub;
    const conversacion = await conversacionDe(req.params.id, yo);

    await prisma.mensaje.updateMany({
      where: { conversacionId: conversacion.id, autorId: { not: yo }, leidoEn: null },
      data: { leidoEn: new Date() },
    });

    const mensajes = await prisma.mensaje.findMany({
      where: { conversacionId: conversacion.id },
      orderBy: { creadoEn: 'asc' },
      take: 500,
    });

    const otro = conversacion.estudianteId === yo ? conversacion.arrendador : conversacion.estudiante;

    res.json({
      conversacion: {
        id: conversacion.id,
        con: otro.nombre.split(' ')[0],
        soyElArrendador: conversacion.arrendadorId === yo,
        inmueble: conversacion.inmueble,
      },
      mensajes: mensajes.map((m) => ({
        id: m.id,
        texto: m.texto,
        creadoEn: m.creadoEn,
        mio: m.autorId === yo,
        leido: m.leidoEn !== null,
      })),
    });
  }),
);

rutasMensajes.post(
  '/conversaciones/:id/mensajes',
  requiereSesion,
  limitadorEnvio,
  asincrono(async (req, res) => {
    const yo = req.usuario!.sub;
    const datos = esquemaEnviarMensaje.parse(req.body);
    const conversacion = await conversacionDe(req.params.id, yo);

    const [mensaje] = await prisma.$transaction([
      prisma.mensaje.create({
        data: { conversacionId: conversacion.id, autorId: yo, texto: datos.texto },
      }),
      prisma.conversacion.update({
        where: { id: conversacion.id },
        data: { ultimoEn: new Date() },
      }),
    ]);

    res.status(201).json({
      mensaje: {
        id: mensaje.id,
        texto: mensaje.texto,
        creadoEn: mensaje.creadoEn,
        mio: true,
        leido: false,
      },
    });
  }),
);
