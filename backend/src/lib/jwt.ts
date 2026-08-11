import jwt from 'jsonwebtoken';
import { env } from './env.js';

export type RolUsuario = 'ESTUDIANTE' | 'ARRENDADOR' | 'ADMIN';

export interface PayloadToken {
  sub: string;
  rol: RolUsuario;
}

const DURACION = '30d';

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: DURACION });
}

export function verificarToken(token: string): PayloadToken | null {
  try {
    const datos = jwt.verify(token, env.JWT_SECRET);
    if (typeof datos === 'string') return null;
    const sub = datos.sub;
    const rol = (datos as Record<string, unknown>).rol;
    if (typeof sub !== 'string') return null;
    if (rol !== 'ESTUDIANTE' && rol !== 'ARRENDADOR' && rol !== 'ADMIN') return null;
    return { sub, rol };
  } catch {
    return null;
  }
}
