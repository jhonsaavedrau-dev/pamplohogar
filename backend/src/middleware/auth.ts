import type { NextFunction, Request, Response } from 'express';
import { verificarToken, type PayloadToken, type RolUsuario } from '../lib/jwt.js';
import { noAutorizado, prohibido } from '../lib/errores.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

function leerToken(req: Request): string | null {
  const cabecera = req.headers.authorization;
  if (!cabecera || !cabecera.startsWith('Bearer ')) return null;
  const token = cabecera.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Exige sesion valida. Corta la peticion si no hay token. */
export function requiereSesion(req: Request, _res: Response, next: NextFunction): void {
  const token = leerToken(req);
  if (!token) return next(noAutorizado());
  const payload = verificarToken(token);
  if (!payload) return next(noAutorizado('Tu sesion vencio. Vuelve a iniciar sesion.'));
  req.usuario = payload;
  next();
}

/** Lee la sesion si viene, pero deja pasar a los visitantes. */
export function sesionOpcional(req: Request, _res: Response, next: NextFunction): void {
  const token = leerToken(req);
  if (token) {
    const payload = verificarToken(token);
    if (payload) req.usuario = payload;
  }
  next();
}

/** Exige que el usuario tenga uno de los roles indicados. */
export function requiereRol(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) return next(noAutorizado());
    if (!roles.includes(req.usuario.rol)) {
      return next(prohibido('Tu tipo de cuenta no puede hacer esta accion.'));
    }
    next();
  };
}
