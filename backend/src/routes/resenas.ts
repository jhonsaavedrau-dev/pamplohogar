import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion } from '../middleware/auth.js';
import { noEncontrado, solicitudInvalida } from '../lib/errores.js';
import { esquemaCrearResena } from '../schemas/resena.js';
import { anotarAccion } from '../lib/registroAdmin.js';

export const rutasResenas = Router();

/** Un estudiante califica al arrendador de un inmueble. Una resena por arrendador. */
rutasResenas.post(
  '/',
  requiereSesion,
  requiereRol('ESTUDIANTE', 'ADMIN'),
  asincrono(async (req, res) => {
    const datos = esquemaCrearResena.parse(req.body);

    const inmueble = await prisma.inmueble.findUnique({ where: { id: datos.inmuebleId } });
    if (!inmueble) throw noEncontrado('Ese inmueble no existe.');
    if (inmueble.arrendadorId === req.usuario!.sub) {
      throw solicitudInvalida('No puedes calificarte a ti mismo.');
    }

    const resena = await prisma.resena.upsert({
      where: {
        autorId_arrendadorId: {
          autorId: req.usuario!.sub,
          arrendadorId: inmueble.arrendadorId,
        },
      },
      create: {
        autorId: req.usuario!.sub,
        arrendadorId: inmueble.arrendadorId,
        inmuebleId: inmueble.id,
        calificacion: datos.calificacion,
        comentario: datos.comentario,
      },
      update: {
        calificacion: datos.calificacion,
        comentario: datos.comentario,
        inmuebleId: inmueble.id,
      },
      include: { autor: { select: { nombre: true } } },
    });

    res.status(201).json({
      resena: {
        id: resena.id,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
        creadoEn: resena.creadoEn,
        autor: resena.autor.nombre,
      },
    });
  }),
);

/** Resenas de un arrendador con su promedio. */
rutasResenas.get(
  '/arrendador/:arrendadorId',
  asincrono(async (req, res) => {
    const resenas = await prisma.resena.findMany({
      where: { arrendadorId: req.params.arrendadorId },
      include: { autor: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
    const promedio = resenas.length > 0 ? Math.round((suma / resenas.length) * 10) / 10 : 0;

    res.json({
      promedio,
      total: resenas.length,
      resenas: resenas.map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        creadoEn: r.creadoEn,
        autor: r.autor.nombre,
      })),
    });
  }),
);

rutasResenas.delete(
  '/:id',
  requiereSesion,
  asincrono(async (req, res) => {
    const resena = await prisma.resena.findUnique({ where: { id: req.params.id } });
    if (!resena) throw noEncontrado('Esa reseña no existe.');
    if (resena.autorId !== req.usuario!.sub && req.usuario!.rol !== 'ADMIN') {
      throw solicitudInvalida('Solo puedes borrar tus propias reseñas.');
    }
    await prisma.resena.delete({ where: { id: req.params.id } });

    if (req.usuario!.rol === 'ADMIN' && resena.autorId !== req.usuario!.sub) {
      anotarAccion(
        req.usuario!.sub,
        'ELIMINO_RESENA',
        `${resena.calificacion} estrellas: "${resena.comentario.slice(0, 120)}"`,
      );
    }

    res.json({ mensaje: 'Reseña eliminada.' });
  }),
);
