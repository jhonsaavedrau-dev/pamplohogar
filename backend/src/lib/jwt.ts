import jwt from 'jsonwebtoken';
import { env } from './env.js';

export type RolUsuario = 'ESTUDIANTE' | 'ARRENDADOR' | 'ADMIN';

export interface PayloadToken {
  sub: string;
  rol: RolUsuario;
}

const DURACION = '30d';

/**
 * Cuanto dura el pase intermedio de la verificacion en dos pasos.
 *
 * Corto a proposito: solo tiene que aguantar lo que se demora alguien en
 * sacar el celular y copiar seis digitos.
 */
const DURACION_PASO_INTERMEDIO = '5m';

/** La marca que distingue un pase intermedio de una sesion de verdad. */
const PASO_INTERMEDIO = 'doble-factor';

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: DURACION });
}

/**
 * Un pase que solo sirve para terminar de entrar escribiendo el codigo.
 *
 * Lleva una marca que `verificarToken` rechaza, para que quien lo intercepte
 * no pueda usarlo como si ya hubiera entrado.
 */
export function firmarPasoIntermedio(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId, paso: PASO_INTERMEDIO }, env.JWT_SECRET, {
    expiresIn: DURACION_PASO_INTERMEDIO,
  });
}

export function verificarPasoIntermedio(token: string): string | null {
  try {
    const datos = jwt.verify(token, env.JWT_SECRET);
    if (typeof datos === 'string') return null;
    const campos = datos as Record<string, unknown>;
    if (campos.paso !== PASO_INTERMEDIO) return null;
    return typeof campos.sub === 'string' ? campos.sub : null;
  } catch {
    return null;
  }
}

export function verificarToken(token: string): PayloadToken | null {
  try {
    const datos = jwt.verify(token, env.JWT_SECRET);
    if (typeof datos === 'string') return null;
    const campos = datos as Record<string, unknown>;
    // Un pase a medio camino no abre ninguna puerta.
    if (campos.paso !== undefined) return null;
    const sub = datos.sub;
    const rol = campos.rol;
    if (typeof sub !== 'string') return null;
    if (rol !== 'ESTUDIANTE' && rol !== 'ARRENDADOR' && rol !== 'ADMIN') return null;
    return { sub, rol };
  } catch {
    return null;
  }
}
