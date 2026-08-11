import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ErrorApi } from '../lib/errores.js';

export function rutaNoEncontrada(_req: Request, res: Response): void {
  res.status(404).json({ mensaje: 'Esta direccion no existe en la API de PamploHogar.' });
}

/** Traduce cualquier error a una respuesta en espanol. El detalle tecnico solo va al log. */
export function manejadorDeErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const primero = error.issues[0];
    res.status(400).json({
      mensaje: primero ? primero.message : 'Revisa los datos que enviaste.',
      campos: error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
    return;
  }

  if (error instanceof ErrorApi) {
    res.status(error.estado).json({ mensaje: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ mensaje: 'Ese registro ya existe.' });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ mensaje: 'No encontramos lo que buscabas.' });
      return;
    }
  }

  process.stderr.write(
    `[PamploHogar] Error no controlado: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  res.status(500).json({
    mensaje: 'Algo fallo de nuestro lado. Intenta de nuevo en un momento.',
  });
}
