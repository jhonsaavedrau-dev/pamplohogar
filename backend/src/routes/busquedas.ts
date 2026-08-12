import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion } from '../middleware/auth.js';
import { noEncontrado, prohibido, solicitudInvalida } from '../lib/errores.js';
import { contarCoincidencias } from '../lib/coincidencias.js';
import {
  esquemaActualizarBusqueda,
  esquemaGuardarBusqueda,
} from '../schemas/busqueda.js';

export const rutasBusquedas = Router();

rutasBusquedas.use(requiereSesion);

const MAXIMO_POR_PERSONA = 10;

/** Las busquedas del usuario, con cuantos inmuebles encajan ahora mismo. */
rutasBusquedas.get(
  '/',
  asincrono(async (req, res) => {
    const busquedas = await prisma.busquedaGuardada.findMany({
      where: { usuarioId: req.usuario!.sub },
      orderBy: { creadoEn: 'desc' },
    });

    const conConteo = await Promise.all(
      busquedas.map(async (b) => ({
        id: b.id,
        nombre: b.nombre,
        avisarPorCorreo: b.avisarPorCorreo,
        creadoEn: b.creadoEn,
        ultimoAvisoEn: b.ultimoAvisoEn,
        filtros: {
          q: b.q,
          tipo: b.tipo,
          barrio: b.barrio,
          precioMin: b.precioMin,
          precioMax: b.precioMax,
          habitaciones: b.habitaciones,
          amoblado: b.amoblado,
          servicios: b.servicios,
        },
        coincidencias: await contarCoincidencias(b),
      })),
    );

    res.json({ busquedas: conConteo });
  }),
);

/** Guarda la busqueda que el estudiante tiene en pantalla. */
rutasBusquedas.post(
  '/',
  asincrono(async (req, res) => {
    const datos = esquemaGuardarBusqueda.parse(req.body);

    if (datos.precioMin !== undefined && datos.precioMax !== undefined) {
      if (datos.precioMin > datos.precioMax) {
        throw solicitudInvalida('El precio mínimo no puede ser mayor que el máximo.');
      }
    }

    const cuantas = await prisma.busquedaGuardada.count({
      where: { usuarioId: req.usuario!.sub },
    });
    if (cuantas >= MAXIMO_POR_PERSONA) {
      throw solicitudInvalida(
        `Ya tienes ${MAXIMO_POR_PERSONA} búsquedas guardadas. Borra alguna para guardar otra.`,
      );
    }

    const busqueda = await prisma.busquedaGuardada.create({
      data: {
        usuarioId: req.usuario!.sub,
        nombre: datos.nombre,
        avisarPorCorreo: datos.avisarPorCorreo,
        q: datos.q ?? null,
        tipo: datos.tipo ?? null,
        barrio: datos.barrio ?? null,
        precioMin: datos.precioMin ?? null,
        precioMax: datos.precioMax ?? null,
        habitaciones: datos.habitaciones ?? null,
        amoblado: datos.amoblado ?? null,
        servicios: datos.servicios,
      },
    });

    res.status(201).json({
      busqueda: { id: busqueda.id, nombre: busqueda.nombre },
      mensaje: datos.avisarPorCorreo
        ? 'Búsqueda guardada. Te avisamos por correo cuando aparezca algo que encaje.'
        : 'Búsqueda guardada.',
    });
  }),
);

/** Cambia el nombre o si quiere avisos. */
rutasBusquedas.patch(
  '/:id',
  asincrono(async (req, res) => {
    const datos = esquemaActualizarBusqueda.parse(req.body);

    const existente = await prisma.busquedaGuardada.findUnique({ where: { id: req.params.id } });
    if (!existente) throw noEncontrado('Esa búsqueda no existe.');
    if (existente.usuarioId !== req.usuario!.sub) {
      throw prohibido('Solo puedes cambiar tus propias búsquedas.');
    }

    const busqueda = await prisma.busquedaGuardada.update({
      where: { id: req.params.id },
      data: {
        ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
        ...(datos.avisarPorCorreo !== undefined
          ? { avisarPorCorreo: datos.avisarPorCorreo }
          : {}),
      },
      select: { id: true, nombre: true, avisarPorCorreo: true },
    });

    res.json({ busqueda });
  }),
);

rutasBusquedas.delete(
  '/:id',
  asincrono(async (req, res) => {
    const existente = await prisma.busquedaGuardada.findUnique({ where: { id: req.params.id } });
    if (!existente) throw noEncontrado('Esa búsqueda no existe.');
    if (existente.usuarioId !== req.usuario!.sub) {
      throw prohibido('Solo puedes borrar tus propias búsquedas.');
    }

    await prisma.busquedaGuardada.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Búsqueda eliminada.' });
  }),
);
