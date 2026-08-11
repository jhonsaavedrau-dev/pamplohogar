import type { NextFunction, Request, Response } from 'express';
import { verificarToken, type PayloadToken, type RolUsuario } from '../lib/jwt.js';
import { noAutorizado, prohibido } from '../lib/errores.js';
import { prisma } from '../lib/prisma.js';

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

/**
 * El rol se lee de la base de datos en cada peticion, no del token.
 *
 * El token solo sirve para saber quien es. Si el rol viajara dentro del token,
 * quitarle el rol a un administrador no tendria efecto hasta que su sesion
 * venciera, y ascender a alguien no funcionaria hasta que volviera a entrar.
 */
async function cargarUsuario(req: Request): Promise<PayloadToken | null> {
  const token = leerToken(req);
  if (!token) return null;

  const payload = verificarToken(token);
  if (!payload) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, rol: true },
  });
  if (!usuario) return null;

  return { sub: usuario.id, rol: usuario.rol };
}

/** Exige sesion valida. Corta la peticion si no hay token o la cuenta ya no existe. */
export function requiereSesion(req: Request, _res: Response, next: NextFunction): void {
  cargarUsuario(req)
    .then((usuario) => {
      if (!usuario) {
        next(noAutorizado('Tu sesion vencio o la cuenta ya no existe. Vuelve a iniciar sesion.'));
        return;
      }
      req.usuario = usuario;
      next();
    })
    .catch(next);
}

/** Lee la sesion si viene, pero deja pasar a los visitantes. */
export function sesionOpcional(req: Request, _res: Response, next: NextFunction): void {
  cargarUsuario(req)
    .then((usuario) => {
      if (usuario) req.usuario = usuario;
      next();
    })
    .catch(() => next());
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
