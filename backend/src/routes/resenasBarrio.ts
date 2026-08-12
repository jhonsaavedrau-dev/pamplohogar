import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion, sesionOpcional } from '../middleware/auth.js';
import { noEncontrado, solicitudInvalida } from '../lib/errores.js';
import { esquemaCrearResenaBarrio } from '../schemas/resenaBarrio.js';
import { claveDeBarrio } from '../lib/barrios.js';
import { anotarAccion } from '../lib/registroAdmin.js';

export const rutasResenasBarrio = Router();

/**
 * Con menos de tres opiniones no se muestra promedio. Una sola persona
 * enojada no puede quedar como "asi es ese barrio".
 */
const MINIMO_PARA_PROMEDIO = 3;

const promedio = (valores: number[]): number =>
  Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;

/**
 * Un estudiante cuenta como es vivir en un barrio. Una opinion por persona y
 * barrio: si guarda otra vez, se reemplaza la anterior en vez de sumarse.
 *
 * Solo estudiantes. Un arrendador calificando el barrio donde arrienda tiene
 * un interes evidente en que se vea bien.
 */
rutasResenasBarrio.post(
  '/',
  requiereSesion,
  requiereRol('ESTUDIANTE', 'ADMIN'),
  asincrono(async (req, res) => {
    const datos = esquemaCrearResenaBarrio.parse(req.body);
    const clave = claveDeBarrio(datos.barrio);
    if (!clave) throw solicitudInvalida('Ese nombre de barrio no es valido.');

    const guardada = await prisma.resenaBarrio.upsert({
      where: { autorId_clave: { autorId: req.usuario!.sub, clave } },
      create: {
        autorId: req.usuario!.sub,
        barrio: datos.barrio,
        clave,
        tranquilidad: datos.tranquilidad,
        seguridad: datos.seguridad,
        transporte: datos.transporte,
        comentario: datos.comentario,
      },
      update: {
        barrio: datos.barrio,
        tranquilidad: datos.tranquilidad,
        seguridad: datos.seguridad,
        transporte: datos.transporte,
        comentario: datos.comentario,
      },
      include: { autor: { select: { nombre: true, emailVerificadoEn: true } } },
    });

    res.status(201).json({
      resena: {
        id: guardada.id,
        tranquilidad: guardada.tranquilidad,
        seguridad: guardada.seguridad,
        transporte: guardada.transporte,
        comentario: guardada.comentario,
        creadoEn: guardada.creadoEn,
        // Solo el nombre de pila: el apellido no ayuda a decidir y expone de
        // mas a quien se anima a contar como es su barrio de verdad.
        autor: guardada.autor.nombre.split(' ')[0],
        correoConfirmado: guardada.autor.emailVerificadoEn !== null,
        esMia: true,
      },
    });
  }),
);

/** Como es vivir en un barrio, segun quienes ya vivieron ahi. */
rutasResenasBarrio.get(
  '/:barrio',
  sesionOpcional,
  asincrono(async (req, res) => {
    const clave = claveDeBarrio(req.params.barrio);
    if (!clave) throw noEncontrado('Ese barrio no existe.');

    const resenas = await prisma.resenaBarrio.findMany({
      where: { clave },
      include: { autor: { select: { nombre: true, emailVerificadoEn: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    const hayBastantes = resenas.length >= MINIMO_PARA_PROMEDIO;

    res.json({
      total: resenas.length,
      minimoParaPromedio: MINIMO_PARA_PROMEDIO,
      promedios: hayBastantes
        ? {
            tranquilidad: promedio(resenas.map((r) => r.tranquilidad)),
            seguridad: promedio(resenas.map((r) => r.seguridad)),
            transporte: promedio(resenas.map((r) => r.transporte)),
          }
        : null,
      yaOpine: resenas.some((r) => r.autorId === req.usuario?.sub),
      resenas: resenas.map((r) => ({
        id: r.id,
        tranquilidad: r.tranquilidad,
        seguridad: r.seguridad,
        transporte: r.transporte,
        comentario: r.comentario,
        creadoEn: r.creadoEn,
        autor: r.autor.nombre.split(' ')[0],
        correoConfirmado: r.autor.emailVerificadoEn !== null,
        esMia: r.autorId === req.usuario?.sub,
      })),
    });
  }),
);

rutasResenasBarrio.delete(
  '/:id',
  requiereSesion,
  asincrono(async (req, res) => {
    const resena = await prisma.resenaBarrio.findUnique({ where: { id: req.params.id } });
    if (!resena) throw noEncontrado('Esa opinion no existe.');
    if (resena.autorId !== req.usuario!.sub && req.usuario!.rol !== 'ADMIN') {
      throw solicitudInvalida('Solo puedes borrar tus propias opiniones.');
    }
    await prisma.resenaBarrio.delete({ where: { id: req.params.id } });

    if (req.usuario!.rol === 'ADMIN' && resena.autorId !== req.usuario!.sub) {
      anotarAccion(
        req.usuario!.sub,
        'ELIMINO_RESENA_BARRIO',
        `${resena.barrio}: "${resena.comentario.slice(0, 120)}"`,
      );
    }

    res.json({ mensaje: 'Opinion eliminada.' });
  }),
);
