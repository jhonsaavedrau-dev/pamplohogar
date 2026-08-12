import type { BusquedaGuardada, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Traduce una busqueda guardada a la consulta de la base de datos.
 *
 * Se usa la misma forma que el buscador de la pagina para que lo que llega
 * por correo sea exactamente lo que el estudiante veria al entrar. Si las dos
 * consultas se separan, la gente recibe avisos de cosas que luego no
 * encuentra, y deja de confiar.
 */
export function condicionesDe(busqueda: BusquedaGuardada): Prisma.InmuebleWhereInput {
  const where: Prisma.InmuebleWhereInput = { activo: true };

  if (busqueda.q) {
    where.OR = [
      { titulo: { contains: busqueda.q, mode: 'insensitive' } },
      { descripcion: { contains: busqueda.q, mode: 'insensitive' } },
      { barrio: { contains: busqueda.q, mode: 'insensitive' } },
      { direccion: { contains: busqueda.q, mode: 'insensitive' } },
    ];
  }
  if (busqueda.tipo) where.tipo = busqueda.tipo;
  if (busqueda.barrio) where.barrio = { contains: busqueda.barrio, mode: 'insensitive' };
  if (busqueda.precioMin !== null || busqueda.precioMax !== null) {
    where.precio = {
      ...(busqueda.precioMin !== null ? { gte: busqueda.precioMin } : {}),
      ...(busqueda.precioMax !== null ? { lte: busqueda.precioMax } : {}),
    };
  }
  if (busqueda.habitaciones !== null) where.habitaciones = { gte: busqueda.habitaciones };
  if (busqueda.amoblado !== null) where.amoblado = busqueda.amoblado;
  if (busqueda.servicios.length > 0) where.servicios = { hasEvery: busqueda.servicios };

  return where;
}

/** Cuantos inmuebles hay ahora mismo para esa busqueda. */
export function contarCoincidencias(busqueda: BusquedaGuardada): Promise<number> {
  return prisma.inmueble.count({ where: condicionesDe(busqueda) });
}

/**
 * Inmuebles que aparecieron desde la ultima revision.
 *
 * Se excluyen los del propio usuario: nadie necesita que le avisen de lo que
 * el mismo publico.
 */
export function novedadesDe(busqueda: BusquedaGuardada, tope = 6) {
  return prisma.inmueble.findMany({
    where: {
      ...condicionesDe(busqueda),
      creadoEn: { gt: busqueda.revisadaHasta },
      arrendadorId: { not: busqueda.usuarioId },
    },
    include: { fotos: { orderBy: { orden: 'asc' }, take: 1 } },
    orderBy: { creadoEn: 'desc' },
    take: tope,
  });
}
