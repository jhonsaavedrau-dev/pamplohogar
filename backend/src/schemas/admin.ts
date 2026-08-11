import { z } from 'zod';

export const esquemaListadoAdmin = z.object({
  q: z.string().trim().max(120).optional(),
  estado: z.enum(['todos', 'activos', 'ocultos']).default('todos'),
  pagina: z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined || v === '' ? 1 : Number(v);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    }),
});

export const esquemaUsuariosAdmin = z.object({
  q: z.string().trim().max(120).optional(),
  rol: z.enum(['todos', 'ESTUDIANTE', 'ARRENDADOR', 'ADMIN']).default('todos'),
  pagina: z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined || v === '' ? 1 : Number(v);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    }),
});

/**
 * El panel solo permite mover a alguien entre estudiante y arrendador.
 * Nombrar administradores queda fuera de la pagina, a proposito: se hace
 * desde el proyecto con "npm run hacer-admin".
 */
export const esquemaCambiarRol = z.object({
  rol: z.enum(['ESTUDIANTE', 'ARRENDADOR'], {
    errorMap: () => ({ message: 'Solo puedes cambiar entre estudiante y arrendador.' }),
  }),
});
