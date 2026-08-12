import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion } from '../middleware/auth.js';
import { noEncontrado, prohibido } from '../lib/errores.js';
import {
  esquemaCambiarRol,
  esquemaListadoAdmin,
  esquemaUsuariosAdmin,
} from '../schemas/admin.js';
import { esquemaAtenderReporte, esquemaListarReportes } from '../schemas/reporte.js';
import { anotarAccion } from '../lib/registroAdmin.js';

export const rutasAdmin = Router();

const POR_PAGINA = 20;

/**
 * Se usa la mediana y no el promedio porque un solo inmueble con un precio
 * absurdo mueve el promedio y esconde como esta el mercado de verdad.
 */
function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? Math.round((ordenados[medio - 1] + ordenados[medio]) / 2)
    : ordenados[medio];
}

/** Marca lo que se sale demasiado del precio normal de la ciudad. */
function esPrecioInusual(precio: number, medianaPrecios: number): boolean {
  if (medianaPrecios === 0) return false;
  return precio > medianaPrecios * 3 || precio < medianaPrecios / 3;
}

async function medianaDePrecios(): Promise<number> {
  const filas = await prisma.inmueble.findMany({
    where: { activo: true },
    select: { precio: true },
  });
  return mediana(filas.map((f) => f.precio));
}

// Todo lo que sigue exige sesion iniciada y rol de administrador.
rutasAdmin.use(requiereSesion, requiereRol('ADMIN'));

/** Numeros generales de la plataforma. */
rutasAdmin.get(
  '/resumen',
  asincrono(async (_req, res) => {
    const [
      estudiantes,
      arrendadores,
      administradores,
      inmueblesActivos,
      inmueblesOcultos,
      solicitudes,
      resenas,
      sinFotos,
      reportesPendientes,
    ] = await Promise.all([
      prisma.usuario.count({ where: { rol: 'ESTUDIANTE' } }),
      prisma.usuario.count({ where: { rol: 'ARRENDADOR' } }),
      prisma.usuario.count({ where: { rol: 'ADMIN' } }),
      prisma.inmueble.count({ where: { activo: true } }),
      prisma.inmueble.count({ where: { activo: false } }),
      prisma.solicitudContacto.count(),
      prisma.resena.count(),
      prisma.inmueble.count({ where: { activo: true, fotos: { none: {} } } }),
      prisma.reporte.count({ where: { estado: 'PENDIENTE' } }),
    ]);

    const filas = await prisma.inmueble.findMany({
      where: { activo: true },
      select: { precio: true },
    });
    const precios = filas.map((f) => f.precio);
    const medianaPrecios = mediana(precios);
    const inusuales = precios.filter((p) => esPrecioInusual(p, medianaPrecios)).length;

    res.json({
      usuarios: { estudiantes, arrendadores, administradores },
      inmuebles: { activos: inmueblesActivos, ocultos: inmueblesOcultos, sinFotos },
      actividad: { solicitudes, resenas, reportesPendientes },
      precios: {
        mediana: medianaPrecios,
        minimo: precios.length > 0 ? Math.min(...precios) : 0,
        maximo: precios.length > 0 ? Math.max(...precios) : 0,
        inusuales,
      },
    });
  }),
);

/** Todos los inmuebles, incluidos los ocultos. */
rutasAdmin.get(
  '/inmuebles',
  asincrono(async (req, res) => {
    const f = esquemaListadoAdmin.parse(req.query);

    const where: Prisma.InmuebleWhereInput = {};
    if (f.estado === 'activos') where.activo = true;
    if (f.estado === 'ocultos') where.activo = false;
    if (f.q) {
      where.OR = [
        { titulo: { contains: f.q, mode: 'insensitive' } },
        { barrio: { contains: f.q, mode: 'insensitive' } },
        { direccion: { contains: f.q, mode: 'insensitive' } },
        { arrendador: { nombre: { contains: f.q, mode: 'insensitive' } } },
        { arrendador: { email: { contains: f.q, mode: 'insensitive' } } },
      ];
    }

    const [total, inmuebles, medianaPrecios] = await Promise.all([
      prisma.inmueble.count({ where }),
      prisma.inmueble.findMany({
        where,
        include: {
          arrendador: { select: { id: true, nombre: true, email: true } },
          _count: { select: { fotos: true, solicitudes: true, favoritos: true } },
        },
        orderBy: { creadoEn: 'desc' },
        skip: (f.pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      medianaDePrecios(),
    ]);

    res.json({
      total,
      pagina: f.pagina,
      totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
      medianaPrecios,
      inmuebles: inmuebles.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        tipo: i.tipo,
        precio: i.precio,
        barrio: i.barrio,
        activo: i.activo,
        creadoEn: i.creadoEn,
        arrendador: i.arrendador,
        fotos: i._count.fotos,
        solicitudes: i._count.solicitudes,
        favoritos: i._count.favoritos,
        precioInusual: esPrecioInusual(i.precio, medianaPrecios),
      })),
    });
  }),
);

/** Todos los usuarios, con cuanto ha publicado cada uno. */
rutasAdmin.get(
  '/usuarios',
  asincrono(async (req, res) => {
    const f = esquemaUsuariosAdmin.parse(req.query);

    const where: Prisma.UsuarioWhereInput = {};
    if (f.rol !== 'todos') where.rol = f.rol;
    if (f.q) {
      where.OR = [
        { nombre: { contains: f.q, mode: 'insensitive' } },
        { email: { contains: f.q, mode: 'insensitive' } },
      ];
    }

    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          rol: true,
          creadoEn: true,
          _count: { select: { inmuebles: true, resenasEscritas: true } },
        },
        orderBy: { creadoEn: 'desc' },
        skip: (f.pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
    ]);

    res.json({
      total,
      pagina: f.pagina,
      totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        telefono: u.telefono,
        rol: u.rol,
        creadoEn: u.creadoEn,
        inmuebles: u._count.inmuebles,
        resenas: u._count.resenasEscritas,
      })),
    });
  }),
);

/** Cambia el rol de un usuario entre estudiante y arrendador. */
rutasAdmin.patch(
  '/usuarios/:id/rol',
  asincrono(async (req, res) => {
    const { rol } = esquemaCambiarRol.parse(req.body);

    if (req.params.id === req.usuario!.sub) {
      throw prohibido('No puedes cambiarte el rol a ti mismo.');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) throw noEncontrado('Ese usuario no existe.');
    if (usuario.rol === 'ADMIN') {
      throw prohibido('No puedes quitarle el rol a otro administrador desde aquí.');
    }

    const actualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { rol },
      select: { id: true, nombre: true, rol: true },
    });

    anotarAccion(
      req.usuario!.sub,
      'CAMBIO_ROL',
      `${usuario.nombre} (${usuario.email}) paso de ${usuario.rol} a ${rol}`,
    );

    res.json({ usuario: actualizado });
  }),
);

/** Elimina una cuenta y todo lo que publico. */
rutasAdmin.delete(
  '/usuarios/:id',
  asincrono(async (req, res) => {
    if (req.params.id === req.usuario!.sub) {
      throw prohibido('No puedes eliminar tu propia cuenta desde el panel.');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) throw noEncontrado('Ese usuario no existe.');
    if (usuario.rol === 'ADMIN') {
      throw prohibido('No puedes eliminar a otro administrador desde aquí.');
    }

    const cuantos = await prisma.inmueble.count({ where: { arrendadorId: usuario.id } });
    await prisma.usuario.delete({ where: { id: req.params.id } });

    anotarAccion(
      req.usuario!.sub,
      'ELIMINO_USUARIO',
      `${usuario.nombre} (${usuario.email}), con ${cuantos} inmuebles`,
    );

    res.json({ mensaje: 'Cuenta eliminada junto con sus publicaciones.' });
  }),
);

/** Reportes que enviaron los estudiantes, pendientes primero. */
rutasAdmin.get(
  '/reportes',
  asincrono(async (req, res) => {
    const { estado } = esquemaListarReportes.parse(req.query);

    const reportes = await prisma.reporte.findMany({
      where: estado === 'todos' ? {} : { estado },
      include: {
        autor: { select: { id: true, nombre: true, email: true } },
        atendidoPor: { select: { nombre: true } },
        inmueble: {
          select: {
            id: true,
            titulo: true,
            precio: true,
            activo: true,
            arrendador: { select: { nombre: true, email: true } },
          },
        },
      },
      orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
      take: 100,
    });

    const pendientes = await prisma.reporte.count({ where: { estado: 'PENDIENTE' } });

    res.json({
      pendientes,
      reportes: reportes.map((r) => ({
        id: r.id,
        motivo: r.motivo,
        detalle: r.detalle,
        estado: r.estado,
        creadoEn: r.creadoEn,
        atendidoEn: r.atendidoEn,
        notaAdmin: r.notaAdmin,
        atendidoPor: r.atendidoPor?.nombre ?? null,
        autor: { nombre: r.autor.nombre, email: r.autor.email },
        inmueble: r.inmueble,
      })),
    });
  }),
);

/** Marca un reporte como atendido o descartado. */
rutasAdmin.patch(
  '/reportes/:id',
  asincrono(async (req, res) => {
    const datos = esquemaAtenderReporte.parse(req.body);

    const existente = await prisma.reporte.findUnique({ where: { id: req.params.id } });
    if (!existente) throw noEncontrado('Ese reporte no existe.');

    const reporte = await prisma.reporte.update({
      where: { id: req.params.id },
      data: {
        estado: datos.estado,
        atendidoEn: new Date(),
        atendidoPorId: req.usuario!.sub,
        notaAdmin: datos.notaAdmin ?? null,
      },
      select: { id: true, estado: true },
    });

    anotarAccion(
      req.usuario!.sub,
      datos.estado === 'ATENDIDO' ? 'ATENDIO_REPORTE' : 'DESCARTO_REPORTE',
      `Reporte por ${existente.motivo}${datos.notaAdmin ? `: ${datos.notaAdmin}` : ''}`,
    );

    res.json({ reporte });
  }),
);

/** Que ha hecho cada administrador, lo mas reciente primero. */
rutasAdmin.get(
  '/registro',
  asincrono(async (_req, res) => {
    const registros = await prisma.registroAdmin.findMany({
      include: { admin: { select: { nombre: true, email: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 200,
    });

    res.json({
      registros: registros.map((r) => ({
        id: r.id,
        accion: r.accion,
        descripcion: r.descripcion,
        creadoEn: r.creadoEn,
        admin: r.admin.nombre,
        adminEmail: r.admin.email,
      })),
    });
  }),
);

/**
 * Conversaciones de la plataforma, para tener la evidencia cuando hay un lio.
 *
 * Es correspondencia privada entre dos personas, asi que no se entra de
 * gratis: cada vez que un administrador abre una queda anotado en el registro,
 * con quienes hablaban y sobre que inmueble. Y a los usuarios se les avisa en
 * la propia pantalla del chat que esto puede pasar. Un poder de moderacion sin
 * rastro y sin avisar no es moderacion, es leer cartas ajenas.
 */
rutasAdmin.get(
  '/conversaciones',
  asincrono(async (req, res) => {
    const texto = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const conversaciones = await prisma.conversacion.findMany({
      where:
        texto === ''
          ? {}
          : {
              OR: [
                { estudiante: { nombre: { contains: texto, mode: 'insensitive' } } },
                { estudiante: { email: { contains: texto, mode: 'insensitive' } } },
                { arrendador: { nombre: { contains: texto, mode: 'insensitive' } } },
                { arrendador: { email: { contains: texto, mode: 'insensitive' } } },
                { inmueble: { titulo: { contains: texto, mode: 'insensitive' } } },
              ],
            },
      orderBy: { ultimoEn: 'desc' },
      take: 60,
      include: {
        inmueble: { select: { id: true, titulo: true } },
        estudiante: { select: { nombre: true, email: true } },
        arrendador: { select: { nombre: true, email: true } },
        _count: { select: { mensajes: true } },
      },
    });

    res.json({
      conversaciones: conversaciones.map((c) => ({
        id: c.id,
        inmuebleId: c.inmueble.id,
        inmuebleTitulo: c.inmueble.titulo,
        estudiante: `${c.estudiante.nombre} (${c.estudiante.email})`,
        arrendador: `${c.arrendador.nombre} (${c.arrendador.email})`,
        mensajes: c._count.mensajes,
        ultimoEn: c.ultimoEn,
      })),
    });
  }),
);

rutasAdmin.get(
  '/conversaciones/:id',
  asincrono(async (req, res) => {
    const conversacion = await prisma.conversacion.findUnique({
      where: { id: req.params.id },
      include: {
        inmueble: { select: { id: true, titulo: true } },
        estudiante: { select: { id: true, nombre: true, email: true } },
        arrendador: { select: { id: true, nombre: true, email: true } },
        mensajes: { orderBy: { creadoEn: 'asc' }, take: 500 },
      },
    });
    if (!conversacion) throw noEncontrado('Esa conversación no existe.');

    // Se anota ANTES de responder. Si el rastro dependiera de que la respuesta
    // salga bien, bastaria con cortar la conexion para leer sin dejar huella.
    anotarAccion(
      req.usuario!.sub,
      'LEYO_CONVERSACION',
      `${conversacion.estudiante.nombre} con ${conversacion.arrendador.nombre} ` +
        `sobre "${conversacion.inmueble.titulo.slice(0, 60)}"`,
    );

    res.json({
      conversacion: {
        id: conversacion.id,
        inmueble: conversacion.inmueble,
        estudiante: `${conversacion.estudiante.nombre} (${conversacion.estudiante.email})`,
        arrendador: `${conversacion.arrendador.nombre} (${conversacion.arrendador.email})`,
      },
      mensajes: conversacion.mensajes.map((m) => ({
        id: m.id,
        texto: m.texto,
        creadoEn: m.creadoEn,
        deQuien: m.autorId === conversacion.estudianteId ? 'estudiante' : 'arrendador',
        leido: m.leidoEn !== null,
      })),
    });
  }),
);

/** Ultimas opiniones de barrio, para poder retirar las abusivas. */
rutasAdmin.get(
  '/resenas-barrio',
  asincrono(async (_req, res) => {
    const resenas = await prisma.resenaBarrio.findMany({
      include: { autor: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    res.json({
      resenas: resenas.map((r) => ({
        id: r.id,
        barrio: r.barrio,
        tranquilidad: r.tranquilidad,
        seguridad: r.seguridad,
        transporte: r.transporte,
        comentario: r.comentario,
        creadoEn: r.creadoEn,
        autor: r.autor.nombre,
      })),
    });
  }),
);

/** Ultimas resenas, para poder retirar las abusivas. */
rutasAdmin.get(
  '/resenas',
  asincrono(async (_req, res) => {
    const resenas = await prisma.resena.findMany({
      include: {
        autor: { select: { id: true, nombre: true } },
        arrendador: { select: { id: true, nombre: true } },
      },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    res.json({
      resenas: resenas.map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        creadoEn: r.creadoEn,
        autor: r.autor.nombre,
        sobre: r.arrendador.nombre,
      })),
    });
  }),
);
