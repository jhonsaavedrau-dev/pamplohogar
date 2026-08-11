import { createHash, randomBytes } from 'node:crypto';
import type { TipoToken } from '@prisma/client';
import { prisma } from './prisma.js';

/** En la base solo se guarda el hash, nunca el codigo que viaja por correo. */
const hashear = (token: string): string => createHash('sha256').update(token).digest('hex');

const DURACIONES_MINUTOS: Record<TipoToken, number> = {
  RECUPERAR_CLAVE: 60,
  VERIFICAR_CORREO: 60 * 24 * 3,
};

/**
 * Crea un token nuevo e invalida los anteriores del mismo tipo.
 * Si alguien pide tres veces el enlace, solo el ultimo sirve.
 */
export async function crearToken(usuarioId: string, tipo: TipoToken): Promise<string> {
  await prisma.tokenCorreo.deleteMany({ where: { usuarioId, tipo, usadoEn: null } });

  const token = randomBytes(32).toString('base64url');
  const expiraEn = new Date(Date.now() + DURACIONES_MINUTOS[tipo] * 60 * 1000);

  await prisma.tokenCorreo.create({
    data: { tokenHash: hashear(token), tipo, usuarioId, expiraEn },
  });

  return token;
}

interface TokenValido {
  id: string;
  usuarioId: string;
}

/** Devuelve el token si sirve: existe, es del tipo correcto, no vencio y no se ha usado. */
export async function validarToken(token: string, tipo: TipoToken): Promise<TokenValido | null> {
  if (token.length === 0) return null;

  const guardado = await prisma.tokenCorreo.findUnique({
    where: { tokenHash: hashear(token) },
    select: { id: true, tipo: true, usuarioId: true, expiraEn: true, usadoEn: true },
  });

  if (!guardado) return null;
  if (guardado.tipo !== tipo) return null;
  if (guardado.usadoEn !== null) return null;
  if (guardado.expiraEn.getTime() < Date.now()) return null;

  return { id: guardado.id, usuarioId: guardado.usuarioId };
}

export async function marcarUsado(id: string): Promise<void> {
  await prisma.tokenCorreo.update({ where: { id }, data: { usadoEn: new Date() } });
}

/** Limpia los tokens vencidos para que la tabla no crezca sin control. */
export async function limpiarTokensVencidos(): Promise<number> {
  const { count } = await prisma.tokenCorreo.deleteMany({
    where: { expiraEn: { lt: new Date() } },
  });
  return count;
}
