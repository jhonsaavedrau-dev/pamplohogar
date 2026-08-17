import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { noEncontrado, solicitudInvalida } from '../lib/errores.js';

export const rutasContacto = Router();

export function armarEnlaceWhatsapp(telefono: string, mensaje: string): string {
  const numero = telefono.replace(/\D/g, '');
  const conIndicativo = numero.startsWith('57') ? numero : `57${numero}`;
  return `https://wa.me/${conIndicativo}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Revela el telefono del arrendador y deja registrada la solicitud.
 * El numero no viaja en ningun otro endpoint.
 */
rutasContacto.post(
  '/inmuebles/:id/contacto',
  requiereSesion,
  asincrono(async (req, res) => {
    const inmueble = await prisma.inmueble.findUnique({
      where: { id: req.params.id },
      include: { arrendador: { select: { id: true, nombre: true, telefono: true } } },
    });
    if (!inmueble || !inmueble.activo) throw noEncontrado('Ese inmueble ya no está disponible.');

    if (inmueble.arrendadorId === req.usuario!.sub) {
      throw solicitudInvalida('Este inmueble es tuyo, no necesitas contactarte.');
    }

    const telefono = inmueble.arrendador.telefono;
    if (!telefono) {
      throw solicitudInvalida(
        'Este arrendador todavía no registró su celular. Intenta con otro inmueble.',
      );
    }

    await prisma.solicitudContacto.create({
      data: { estudianteId: req.usuario!.sub, inmuebleId: inmueble.id },
    });

    const solicitante = await prisma.usuario.findUnique({
      where: { id: req.usuario!.sub },
      select: { nombre: true },
    });

    const mensaje =
      `Hola ${inmueble.arrendador.nombre}, soy ${solicitante?.nombre ?? 'un estudiante'}. ` +
      `Vi tu publicación "${inmueble.titulo}" en PamploHogar y me interesa. ` +
      `Sigue disponible?`;

    res.json({
      telefono,
      nombreArrendador: inmueble.arrendador.nombre,
      enlaceWhatsapp: armarEnlaceWhatsapp(telefono, mensaje),
    });
  }),
);

/** Solicitudes recibidas en los inmuebles del arrendador. */
rutasContacto.get(
  '/solicitudes',
  requiereSesion,
  asincrono(async (req, res) => {
    const solicitudes = await prisma.solicitudContacto.findMany({
      where: { inmueble: { arrendadorId: req.usuario!.sub } },
      include: {
        estudiante: { select: { nombre: true, email: true } },
        inmueble: { select: { id: true, titulo: true } },
      },
      orderBy: { creadoEn: 'desc' },
      take: 100,
    });

    res.json({
      solicitudes: solicitudes.map((s) => ({
        id: s.id,
        creadoEn: s.creadoEn,
        estudiante: s.estudiante.nombre,
        email: s.estudiante.email,
        inmueble: s.inmueble,
      })),
    });
  }),
);
