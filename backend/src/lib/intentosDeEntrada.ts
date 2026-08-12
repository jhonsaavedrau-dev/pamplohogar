import { prisma } from './prisma.js';

/**
 * Cuantos fallos seguidos aguanta una cuenta antes de frenarse.
 *
 * Diez deja equivocarse varias veces sin castigar a nadie de verdad, y sigue
 * siendo un muro para quien va probando contrasenas una por una.
 */
export const FALLOS_PERMITIDOS = 10;

/** Cuanto se frena la cuenta al llegar al tope. */
export const MINUTOS_DE_FRENO = 15;

/**
 * Este freno va por cuenta, no por conexion.
 *
 * El limite por conexion existe desde el principio, pero en el wifi de la
 * universidad todo el mundo sale con la misma direccion: si uno solo se pone
 * a probar contrasenas, el limite por conexion frena tambien a los demas.
 * Contando aparte por cuenta se protege cada cuenta sin dejar por fuera al
 * resto del campus.
 *
 * Tiene un costo: alguien puede frenar la cuenta de otro a proposito
 * escribiendo mal la contrasena diez veces. Se acepta porque el freno dura
 * quince minutos y, sobre todo, porque recuperar la contrasena por correo lo
 * levanta de inmediato. Nadie queda encerrado fuera de su cuenta.
 */

export interface EstadoDeFreno {
  frenada: boolean;
  minutosQueFaltan: number;
}

export function revisarFreno(bloqueadoHasta: Date | null, ahora: Date): EstadoDeFreno {
  if (bloqueadoHasta === null || bloqueadoHasta <= ahora) {
    return { frenada: false, minutosQueFaltan: 0 };
  }
  const faltan = Math.ceil((bloqueadoHasta.getTime() - ahora.getTime()) / 60000);
  return { frenada: true, minutosQueFaltan: Math.max(1, faltan) };
}

/**
 * Que hacer despues de un intento fallido. Se separa de la base de datos para
 * poder comprobar la cuenta sola, sin levantar nada.
 */
export function siguienteEstadoTrasFallo(
  intentosPrevios: number,
  ahora: Date,
): { intentosFallidos: number; bloqueadoHasta: Date | null } {
  const intentos = intentosPrevios + 1;
  if (intentos < FALLOS_PERMITIDOS) {
    return { intentosFallidos: intentos, bloqueadoHasta: null };
  }
  // Al frenar se vuelve a cero: cuando pasen los quince minutos, la persona
  // tiene otros diez intentos y no queda a uno solo de que la frenen de nuevo.
  return {
    intentosFallidos: 0,
    bloqueadoHasta: new Date(ahora.getTime() + MINUTOS_DE_FRENO * 60000),
  };
}

export async function anotarFallo(usuarioId: string, intentosPrevios: number): Promise<void> {
  const estado = siguienteEstadoTrasFallo(intentosPrevios, new Date());
  await prisma.usuario.update({ where: { id: usuarioId }, data: estado });
}

/** Al entrar bien, o al cambiar la contrasena por correo, se borra el rastro. */
export async function limpiarFallos(usuarioId: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { intentosFallidos: 0, bloqueadoHasta: null },
  });
}
