import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Envuelve un manejador async para que los errores lleguen al middleware de errores. */
export function asincrono(
  manejador: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    manejador(req, res, next).catch(next);
  };
}
