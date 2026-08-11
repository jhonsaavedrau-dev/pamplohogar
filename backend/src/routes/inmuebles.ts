import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion, sesionOpcional } from '../middleware/auth.js';
import { noEncontrado, prohibido } from '../lib/errores.js';
import { distanciaAUniversidad } from '../lib/geo.js';
import {
  esquemaActualizarInmueble,
  esquemaBusqueda,
  esquemaCrearInmueble,
} from '../schemas/inmueble.js';

export const rutasInmuebles = Router();

const POR_PAGINA = 12;

const inclusionListado = {
  fotos: { orderBy: { orden: 'asc' } as const },
  arrendador: { select: { id: true, nombre: true } },
} satisfies Prisma.InmuebleInclude;

type InmuebleConRelaciones = Prisma.InmuebleGetPayload<{ include: typeof inclusionListado }>;

/** Promedio de estrellas por arrendador, para no consultar uno por uno. */
async function promediosPorArrendador(ids: string[]): Promise<Map<string, { promedio: number; total: number }>> {
  if (ids.length === 0) return new Map();
  const filas = await prisma.resena.groupBy({
    by: ['arrendadorId'],
    where: { arrendadorId: { in: ids } },
    _avg: { calificacion: true },
    _count: { _all: true },
  });
  return new Map(
    filas.map((f) => [
      f.arrendadorId,
      { promedio: Math.round((f._avg.calificacion ?? 0) * 10) / 10, total: f._count._all },
    ]),
  );
}

function formatearInmueble(
  inmueble: InmuebleConRelaciones,
  calificaciones: Map<string, { promedio: number; total: number }>,
) {
  const calificacion = calificaciones.get(inmueble.arrendadorId) ?? { promedio: 0, total: 0 };
  return {
    id: inmueble.id,
    titulo: inmueble.titulo,
    descripcion: inmueble.descripcion,
    tipo: inmueble.tipo,
    precio: inmueble.precio,
    barrio: inmueble.barrio,
    direccion: inmueble.direccion,
    lat: inmueble.lat,
    lng: inmueble.lng,
    habitaciones: inmueble.habitaciones,
    banos: inmueble.banos,
    servicios: inmueble.servicios,
    amoblado: inmueble.amoblado,
    activo: inmueble.activo,
    creadoEn: inmueble.creadoEn,
    distanciaUniversidadKm: Math.round(distanciaAUniversidad(inmueble.lat, inmueble.lng) * 10) / 10,
    fotos: inmueble.fotos.map((f) => ({ id: f.id, url: f.url, publicId: f.publicId })),
    arrendador: {
      id: inmueble.arrendador.id,
      nombre: inmueble.arrendador.nombre,
      calificacionPromedio: calificacion.promedio,
      totalResenas: calificacion.total,
    },
  };
}

/** Listado publico con filtros. */
rutasInmuebles.get(
  '/',
  asincrono(async (req, res) => {
    const f = esquemaBusqueda.parse(req.query);

    const where: Prisma.InmuebleWhereInput = { activo: true };

    if (f.q) {
      where.OR = [
        { titulo: { contains: f.q, mode: 'insensitive' } },
        { descripcion: { contains: f.q, mode: 'insensitive' } },
        { barrio: { contains: f.q, mode: 'insensitive' } },
        { direccion: { contains: f.q, mode: 'insensitive' } },
      ];
    }
    if (f.tipo) where.tipo = f.tipo;
    if (f.barrio) where.barrio = { contains: f.barrio, mode: 'insensitive' };
    if (f.precioMin !== undefined || f.precioMax !== undefined) {
      where.precio = {
        ...(f.precioMin !== undefined ? { gte: Math.floor(f.precioMin) } : {}),
        ...(f.precioMax !== undefined ? { lte: Math.floor(f.precioMax) } : {}),
      };
    }
    if (f.habitaciones !== undefined) where.habitaciones = { gte: Math.floor(f.habitaciones) };
    if (f.amoblado !== undefined) where.amoblado = f.amoblado;
    if (f.servicios && f.servicios.length > 0) where.servicios = { hasEvery: f.servicios };

    const total = await prisma.inmueble.count({ where });

    // El orden por cercania se calcula en memoria porque depende de la formula de Haversine.
    if (f.orden === 'cercania') {
      const todos = await prisma.inmueble.findMany({ where, include: inclusionListado });
      const calificaciones = await promediosPorArrendador(todos.map((i) => i.arrendadorId));
      const ordenados = todos
        .map((i) => formatearInmueble(i, calificaciones))
        .sort((a, b) => a.distanciaUniversidadKm - b.distanciaUniversidadKm);
      const inicio = (f.pagina - 1) * POR_PAGINA;
      res.json({
        inmuebles: ordenados.slice(inicio, inicio + POR_PAGINA),
        total,
        pagina: f.pagina,
        porPagina: POR_PAGINA,
        totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
      });
      return;
    }

    const orderBy: Prisma.InmuebleOrderByWithRelationInput =
      f.orden === 'precioAsc'
        ? { precio: 'asc' }
        : f.orden === 'precioDesc'
          ? { precio: 'desc' }
          : { creadoEn: 'desc' };

    const inmuebles = await prisma.inmueble.findMany({
      where,
      include: inclusionListado,
      orderBy,
      skip: (f.pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    });

    const calificaciones = await promediosPorArrendador(inmuebles.map((i) => i.arrendadorId));

    res.json({
      inmuebles: inmuebles.map((i) => formatearInmueble(i, calificaciones)),
      total,
      pagina: f.pagina,
      porPagina: POR_PAGINA,
      totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    });
  }),
);

/** Barrios disponibles, para llenar el filtro. */
rutasInmuebles.get(
  '/barrios',
  asincrono(async (_req, res) => {
    const filas = await prisma.inmueble.findMany({
      where: { activo: true },
      select: { barrio: true },
      distinct: ['barrio'],
      orderBy: { barrio: 'asc' },
    });
    res.json({ barrios: filas.map((f) => f.barrio) });
  }),
);

/** Inmuebles del arrendador que tiene la sesion abierta, incluidos los ocultos. */
rutasInmuebles.get(
  '/mios',
  requiereSesion,
  requiereRol('ARRENDADOR', 'ADMIN'),
  asincrono(async (req, res) => {
    const inmuebles = await prisma.inmueble.findMany({
      where: { arrendadorId: req.usuario!.sub },
      include: inclusionListado,
      orderBy: { creadoEn: 'desc' },
    });
    const calificaciones = await promediosPorArrendador([req.usuario!.sub]);
    res.json({ inmuebles: inmuebles.map((i) => formatearInmueble(i, calificaciones)) });
  }),
);

/** Detalle publico. El telefono del arrendador nunca viaja aqui. */
rutasInmuebles.get(
  '/:id',
  sesionOpcional,
  asincrono(async (req, res) => {
    const inmueble = await prisma.inmueble.findUnique({
      where: { id: req.params.id },
      include: inclusionListado,
    });
    if (!inmueble) throw noEncontrado('Ese inmueble no existe o fue retirado.');

    const esDueno = req.usuario?.sub === inmueble.arrendadorId;
    if (!inmueble.activo && !esDueno) throw noEncontrado('Ese inmueble ya no esta disponible.');

    const calificaciones = await promediosPorArrendador([inmueble.arrendadorId]);

    const resenas = await prisma.resena.findMany({
      where: { arrendadorId: inmueble.arrendadorId },
      include: { autor: { select: { id: true, nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 20,
    });

    let esFavorito = false;
    if (req.usuario) {
      const fav = await prisma.favorito.findUnique({
        where: { usuarioId_inmuebleId: { usuarioId: req.usuario.sub, inmuebleId: inmueble.id } },
      });
      esFavorito = fav !== null;
    }

    res.json({
      inmueble: formatearInmueble(inmueble, calificaciones),
      esFavorito,
      esDueno,
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

/** Publicar inmueble. Solo arrendadores. */
rutasInmuebles.post(
  '/',
  requiereSesion,
  requiereRol('ARRENDADOR', 'ADMIN'),
  asincrono(async (req, res) => {
    const datos = esquemaCrearInmueble.parse(req.body);

    const inmueble = await prisma.inmueble.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        tipo: datos.tipo,
        precio: datos.precio,
        barrio: datos.barrio,
        direccion: datos.direccion,
        lat: datos.lat,
        lng: datos.lng,
        habitaciones: datos.habitaciones,
        banos: datos.banos,
        servicios: datos.servicios,
        amoblado: datos.amoblado,
        arrendadorId: req.usuario!.sub,
        fotos: {
          create: datos.fotos.map((foto, indice) => ({
            url: foto.url,
            publicId: foto.publicId,
            orden: indice,
          })),
        },
      },
      include: inclusionListado,
    });

    const calificaciones = await promediosPorArrendador([inmueble.arrendadorId]);
    res.status(201).json({ inmueble: formatearInmueble(inmueble, calificaciones) });
  }),
);

/** Editar. Solo el dueno del inmueble. */
rutasInmuebles.patch(
  '/:id',
  requiereSesion,
  asincrono(async (req, res) => {
    const existente = await prisma.inmueble.findUnique({ where: { id: req.params.id } });
    if (!existente) throw noEncontrado('Ese inmueble no existe.');
    if (existente.arrendadorId !== req.usuario!.sub && req.usuario!.rol !== 'ADMIN') {
      throw prohibido('Solo puedes editar los inmuebles que tu publicaste.');
    }

    const datos = esquemaActualizarInmueble.parse(req.body);
    const { fotos, ...camposSimples } = datos;

    const inmueble = await prisma.inmueble.update({
      where: { id: req.params.id },
      data: {
        ...camposSimples,
        ...(fotos !== undefined
          ? {
              fotos: {
                deleteMany: {},
                create: fotos.map((foto, indice) => ({
                  url: foto.url,
                  publicId: foto.publicId,
                  orden: indice,
                })),
              },
            }
          : {}),
      },
      include: inclusionListado,
    });

    const calificaciones = await promediosPorArrendador([inmueble.arrendadorId]);
    res.json({ inmueble: formatearInmueble(inmueble, calificaciones) });
  }),
);

/** Retirar del listado. Solo el dueno. */
rutasInmuebles.delete(
  '/:id',
  requiereSesion,
  asincrono(async (req, res) => {
    const existente = await prisma.inmueble.findUnique({ where: { id: req.params.id } });
    if (!existente) throw noEncontrado('Ese inmueble no existe.');
    if (existente.arrendadorId !== req.usuario!.sub && req.usuario!.rol !== 'ADMIN') {
      throw prohibido('Solo puedes retirar los inmuebles que tu publicaste.');
    }

    await prisma.inmueble.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Inmueble eliminado.' });
  }),
);
