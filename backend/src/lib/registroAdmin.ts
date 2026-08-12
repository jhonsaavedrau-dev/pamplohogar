import type { AccionAdmin } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Anota lo que hizo un administrador.
 *
 * Nunca tumba la operacion: si el registro falla, la accion que el
 * administrador pidio ya ocurrio y no tiene sentido devolverle un error por
 * no haber podido anotarla. El fallo queda en el log del servidor.
 */
export function anotarAccion(
  adminId: string,
  accion: AccionAdmin,
  descripcion: string,
): void {
  void prisma.registroAdmin
    .create({ data: { adminId, accion, descripcion: descripcion.slice(0, 300) } })
    .catch((error: unknown) => {
      process.stderr.write(
        `[PamploHogar] No se pudo anotar la acción ${accion}: ${
          error instanceof Error ? error.message : String(error)
        }\n`,
      );
    });
}

export const ETIQUETAS_ACCION: Record<AccionAdmin, string> = {
  OCULTO_INMUEBLE: 'Retiro un inmueble',
  MOSTRO_INMUEBLE: 'Volvio a publicar un inmueble',
  ELIMINO_INMUEBLE: 'Elimino un inmueble',
  ELIMINO_USUARIO: 'Elimino una cuenta',
  CAMBIO_ROL: 'Cambio el rol de alguien',
  ELIMINO_RESENA: 'Retiro una reseña',
  ATENDIO_REPORTE: 'Atendio un reporte',
  DESCARTO_REPORTE: 'Descarto un reporte',
};
