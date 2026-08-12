import { createHash, randomInt } from 'node:crypto';
import { prisma } from './prisma.js';
import { correoConfigurado, correoDeCodigoDeEntrada, enviarCorreo } from './correo.js';

/*
  El codigo de seis digitos que llega al correo.

  Es la otra forma de verificacion en dos pasos, para quien no quiere instalar
  una app. Tiene una pega grande hoy: mientras PamploHogar no tenga dominio
  propio, el servicio de correo solo entrega a la direccion del dueno de la
  plataforma. Por eso activarla exige recibir un codigo de prueba y escribirlo:
  si el correo no llega, la verificacion no se activa y nadie se queda
  encerrado fuera de su cuenta.
*/

/** Cuanto vale un codigo. Suficiente para abrir el correo sin correr. */
const MINUTOS = 10;

const resumir = (codigo: string): string =>
  createHash('sha256').update(codigo.replace(/\D/g, '')).digest('hex');

/**
 * Seis digitos al azar de verdad.
 *
 * Con `randomInt` y no con `Math.random`, que es predecible: quien vea unos
 * cuantos codigos podria calcular los siguientes.
 */
export const codigoNuevo = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

/**
 * Genera un codigo, lo guarda y lo manda.
 *
 * Devuelve si de verdad salio. Un codigo que no llego no sirve de nada, y
 * quien llama tiene que poder decirlo en vez de dejar a alguien esperando.
 */
export async function mandarCodigo(usuarioId: string): Promise<boolean> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { email: true, nombre: true },
  });
  if (!usuario) return false;
  if (!correoConfigurado) return false;

  const codigo = codigoNuevo();

  // Se guarda antes de mandarlo: si se guardara despues y el envio tardara,
  // podria llegar el correo y la pagina todavia no reconocer el codigo.
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      codigoCorreoHash: resumir(codigo),
      codigoCorreoExpira: new Date(Date.now() + MINUTOS * 60 * 1000),
    },
  });

  const salio = await enviarCorreo(
    correoDeCodigoDeEntrada(usuario.email, usuario.nombre.split(' ')[0], codigo),
  );

  if (!salio) {
    // Si no salio, se borra. Dejar vivo un codigo que nadie recibio solo sirve
    // para que alguien lo adivine.
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { codigoCorreoHash: null, codigoCorreoExpira: null },
    });
  }

  return salio;
}

export type RevisionDeCodigo = 'bueno' | 'vencido' | 'malo';

export function revisarCodigoDeCorreo(
  guardado: string | null,
  expira: Date | null,
  codigo: string,
  ahora: Date,
): RevisionDeCodigo {
  if (guardado === null || expira === null) return 'malo';
  if (resumir(codigo) !== guardado) return 'malo';
  // Se mira el vencimiento despues de comprobar que acerto, para poder decirle
  // "se te vencio, pide otro" en vez de "esta mal", que lo dejaria buscando un
  // error de tecleo que no existe.
  if (expira <= ahora) return 'vencido';
  return 'bueno';
}

/** Un codigo usado se borra en el acto: sirve una sola vez. */
export async function gastarCodigo(usuarioId: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { codigoCorreoHash: null, codigoCorreoExpira: null },
  });
}
