import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { noEncontrado, solicitudInvalida } from '../lib/errores.js';
import { esquemaCrearReporte } from '../schemas/reporte.js';

export const rutasReportes = Router();

/**
 * Un usuario avisa que una publicacion no deberia estar.
 * Solo un reporte por persona e inmueble: si vuelve a reportar, actualiza el suyo
 * en lugar de inflar la cola del administrador.
 */
rutasReportes.post(
  '/inmuebles/:id/reportes',
  requiereSesion,
  asincrono(async (req, res) => {
    const datos = esquemaCrearReporte.parse(req.body);

    const inmueble = await prisma.inmueble.findUnique({ where: { id: req.params.id } });
    if (!inmueble) throw noEncontrado('Ese inmueble no existe.');

    if (inmueble.arrendadorId === req.usuario!.sub) {
      throw solicitudInvalida('Este inmueble es tuyo. Si quieres, puedes retirarlo o editarlo.');
    }

    await prisma.reporte.upsert({
      where: {
        autorId_inmuebleId: { autorId: req.usuario!.sub, inmuebleId: inmueble.id },
      },
      create: {
        autorId: req.usuario!.sub,
        inmuebleId: inmueble.id,
        motivo: datos.motivo,
        detalle: datos.detalle,
      },
      update: {
        motivo: datos.motivo,
        detalle: datos.detalle,
        estado: 'PENDIENTE',
        atendidoEn: null,
        atendidoPorId: null,
        notaAdmin: null,
      },
    });

    res.status(201).json({
      mensaje: 'Gracias por avisarnos. Vamos a revisar esta publicacion.',
    });
  }),
);

/** Saber si el usuario ya reporto este inmueble, para no ofrecerselo dos veces. */
rutasReportes.get(
  '/inmuebles/:id/reportes/mio',
  requiereSesion,
  asincrono(async (req, res) => {
    const reporte = await prisma.reporte.findUnique({
      where: {
        autorId_inmuebleId: { autorId: req.usuario!.sub, inmuebleId: req.params.id },
      },
      select: { motivo: true, estado: true, creadoEn: true },
    });

    res.json({ reporte });
  }),
);
