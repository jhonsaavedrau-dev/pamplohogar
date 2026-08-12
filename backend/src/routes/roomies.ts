import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereSesion, sesionOpcional } from '../middleware/auth.js';
import { noEncontrado, solicitudInvalida } from '../lib/errores.js';
import { esquemaBuscarRoomies, esquemaPerfilRoomie } from '../schemas/roomie.js';

export const rutasRoomies = Router();

const POR_PAGINA = 12;

const seleccion = {
  id: true,
  presupuestoMax: true,
  descripcion: true,
  zonaPreferida: true,
  carrera: true,
  semestre: true,
  ritmo: true,
  conQuien: true,
  fuma: true,
  tieneMascota: true,
  aceptaMascotas: true,
  activo: true,
  creadoEn: true,
  usuario: { select: { id: true, nombre: true, emailVerificadoEn: true } },
} satisfies Prisma.PerfilRoomieSelect;

type PerfilConUsuario = Prisma.PerfilRoomieGetPayload<{ select: typeof seleccion }>;

/** El telefono nunca sale aqui: solo aparece cuando alguien pulsa contactar. */
function formatear(perfil: PerfilConUsuario) {
  return {
    id: perfil.id,
    presupuestoMax: perfil.presupuestoMax,
    descripcion: perfil.descripcion,
    zonaPreferida: perfil.zonaPreferida,
    carrera: perfil.carrera,
    semestre: perfil.semestre,
    ritmo: perfil.ritmo,
    conQuien: perfil.conQuien,
    fuma: perfil.fuma,
    tieneMascota: perfil.tieneMascota,
    aceptaMascotas: perfil.aceptaMascotas,
    activo: perfil.activo,
    creadoEn: perfil.creadoEn,
    // Solo el nombre de pila: el apellido completo no le sirve a nadie para
    // decidir y expone mas de lo necesario en una pagina publica.
    nombre: perfil.usuario.nombre.split(' ')[0],
    usuarioId: perfil.usuario.id,
    correoVerificado: perfil.usuario.emailVerificadoEn !== null,
  };
}

/** Listado publico de quienes buscan roomie. */
rutasRoomies.get(
  '/',
  sesionOpcional,
  asincrono(async (req, res) => {
    const f = esquemaBuscarRoomies.parse(req.query);

    const where: Prisma.PerfilRoomieWhereInput = { activo: true };

    if (f.presupuestoMin !== undefined || f.presupuestoMax !== undefined) {
      where.presupuestoMax = {
        ...(f.presupuestoMin !== undefined ? { gte: Math.floor(f.presupuestoMin) } : {}),
        ...(f.presupuestoMax !== undefined ? { lte: Math.floor(f.presupuestoMax) } : {}),
      };
    }
    if (f.zona) where.zonaPreferida = { contains: f.zona, mode: 'insensitive' };
    if (f.ritmo) where.ritmo = f.ritmo;
    if (f.aceptaMascotas === true) where.aceptaMascotas = true;
    if (f.sinFumadores === true) where.fuma = false;

    const [total, perfiles] = await Promise.all([
      prisma.perfilRoomie.count({ where }),
      prisma.perfilRoomie.findMany({
        where,
        select: seleccion,
        orderBy: { actualizadoEn: 'desc' },
        skip: (f.pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
    ]);

    res.json({
      perfiles: perfiles.map(formatear),
      total,
      pagina: f.pagina,
      totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
      // Sirve para mostrar el boton correcto sin una segunda peticion.
      tengoPerfil:
        req.usuario !== undefined
          ? (await prisma.perfilRoomie.count({ where: { usuarioId: req.usuario.sub } })) > 0
          : false,
    });
  }),
);

/** El perfil propio, para editarlo. */
rutasRoomies.get(
  '/mio',
  requiereSesion,
  asincrono(async (req, res) => {
    const perfil = await prisma.perfilRoomie.findUnique({
      where: { usuarioId: req.usuario!.sub },
      select: seleccion,
    });
    res.json({ perfil: perfil ? formatear(perfil) : null });
  }),
);

/** Crea o actualiza el perfil. Uno por persona. */
rutasRoomies.put(
  '/mio',
  requiereSesion,
  asincrono(async (req, res) => {
    const datos = esquemaPerfilRoomie.parse(req.body);

    const campos = {
      presupuestoMax: datos.presupuestoMax,
      descripcion: datos.descripcion,
      zonaPreferida: datos.zonaPreferida ?? null,
      carrera: datos.carrera ?? null,
      semestre: datos.semestre ?? null,
      ritmo: datos.ritmo,
      conQuien: datos.conQuien,
      fuma: datos.fuma,
      tieneMascota: datos.tieneMascota,
      aceptaMascotas: datos.aceptaMascotas,
      activo: datos.activo,
    };

    const perfil = await prisma.perfilRoomie.upsert({
      where: { usuarioId: req.usuario!.sub },
      create: { usuarioId: req.usuario!.sub, ...campos },
      update: campos,
      select: seleccion,
    });

    res.json({ perfil: formatear(perfil) });
  }),
);

rutasRoomies.delete(
  '/mio',
  requiereSesion,
  asincrono(async (req, res) => {
    await prisma.perfilRoomie.deleteMany({ where: { usuarioId: req.usuario!.sub } });
    res.json({ mensaje: 'Tu perfil de roomie fue eliminado.' });
  }),
);

/**
 * Revela el celular y deja constancia, igual que con los inmuebles.
 * Nadie ve el numero de otro sin quedar registrado.
 */
rutasRoomies.post(
  '/:id/contacto',
  requiereSesion,
  asincrono(async (req, res) => {
    const perfil = await prisma.perfilRoomie.findUnique({
      where: { id: req.params.id },
      include: { usuario: { select: { id: true, nombre: true, telefono: true } } },
    });
    if (!perfil || !perfil.activo) throw noEncontrado('Ese perfil ya no está disponible.');

    if (perfil.usuarioId === req.usuario!.sub) {
      throw solicitudInvalida('Ese perfil es tuyo.');
    }

    const telefono = perfil.usuario.telefono;
    if (!telefono) {
      throw solicitudInvalida(
        'Esta persona todavía no registró su celular. Intenta con otro perfil.',
      );
    }

    await prisma.contactoRoomie.upsert({
      where: {
        solicitanteId_perfilId: { solicitanteId: req.usuario!.sub, perfilId: perfil.id },
      },
      create: {
        solicitanteId: req.usuario!.sub,
        destinatarioId: perfil.usuarioId,
        perfilId: perfil.id,
      },
      update: {},
    });

    const quienPide = await prisma.usuario.findUnique({
      where: { id: req.usuario!.sub },
      select: { nombre: true },
    });

    const numero = telefono.replace(/\D/g, '');
    const conIndicativo = numero.startsWith('57') ? numero : `57${numero}`;
    const mensaje =
      `Hola ${perfil.usuario.nombre.split(' ')[0]}, soy ${quienPide?.nombre ?? 'un estudiante'}. ` +
      `Te vi en PamploHogar buscando con quien compartir arriendo. Cuadramos?`;

    res.json({
      telefono,
      nombre: perfil.usuario.nombre.split(' ')[0],
      enlaceWhatsapp: `https://wa.me/${conIndicativo}?text=${encodeURIComponent(mensaje)}`,
    });
  }),
);
