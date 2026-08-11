import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { noEncontrado } from '../lib/errores.js';
import { distanciaAUniversidad } from '../lib/geo.js';

export const rutasFavoritos = Router();

rutasFavoritos.use(requiereSesion);

rutasFavoritos.get(
  '/',
  asincrono(async (req, res) => {
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId: req.usuario!.sub },
      include: {
        inmueble: {
          include: {
            fotos: { orderBy: { orden: 'asc' } },
            arrendador: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.json({
      inmuebles: favoritos
        .filter((f) => f.inmueble.activo)
        .map((f) => ({
          id: f.inmueble.id,
          titulo: f.inmueble.titulo,
          tipo: f.inmueble.tipo,
          precio: f.inmueble.precio,
          barrio: f.inmueble.barrio,
          habitaciones: f.inmueble.habitaciones,
          banos: f.inmueble.banos,
          servicios: f.inmueble.servicios,
          amoblado: f.inmueble.amoblado,
          distanciaUniversidadKm:
            Math.round(distanciaAUniversidad(f.inmueble.lat, f.inmueble.lng) * 10) / 10,
          fotos: f.inmueble.fotos.map((foto) => ({ id: foto.id, url: foto.url })),
          arrendador: { id: f.inmueble.arrendador.id, nombre: f.inmueble.arrendador.nombre },
        })),
    });
  }),
);

rutasFavoritos.post(
  '/:inmuebleId',
  asincrono(async (req, res) => {
    const inmueble = await prisma.inmueble.findUnique({ where: { id: req.params.inmuebleId } });
    if (!inmueble) throw noEncontrado('Ese inmueble no existe.');

    await prisma.favorito.upsert({
      where: {
        usuarioId_inmuebleId: {
          usuarioId: req.usuario!.sub,
          inmuebleId: req.params.inmuebleId,
        },
      },
      create: { usuarioId: req.usuario!.sub, inmuebleId: req.params.inmuebleId },
      update: {},
    });

    res.status(201).json({ esFavorito: true });
  }),
);

rutasFavoritos.delete(
  '/:inmuebleId',
  asincrono(async (req, res) => {
    await prisma.favorito.deleteMany({
      where: { usuarioId: req.usuario!.sub, inmuebleId: req.params.inmuebleId },
    });
    res.json({ esFavorito: false });
  }),
);
