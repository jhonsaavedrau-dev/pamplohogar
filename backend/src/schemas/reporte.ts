import { z } from 'zod';

export const MOTIVOS = [
  'PRECIO_ABUSIVO',
  'INFORMACION_FALSA',
  'NO_EXISTE',
  'NO_RESPONDE',
  'TRATO_IRRESPETUOSO',
  'OTRO',
] as const;

export const esquemaCrearReporte = z.object({
  motivo: z.enum(MOTIVOS, {
    errorMap: () => ({ message: 'Elige por que estas reportando esta publicación.' }),
  }),
  detalle: z
    .string()
    .trim()
    .min(20, 'Cuentanos que paso en al menos 20 caracteres para poder revisarlo.')
    .max(1000, 'El detalle es demasiado largo.'),
});

export const esquemaAtenderReporte = z.object({
  estado: z.enum(['ATENDIDO', 'DESCARTADO'], {
    errorMap: () => ({ message: 'Marca el reporte como atendido o descartado.' }),
  }),
  notaAdmin: z.string().trim().max(500).optional(),
});

export const esquemaListarReportes = z.object({
  estado: z.enum(['todos', 'PENDIENTE', 'ATENDIDO', 'DESCARTADO']).default('PENDIENTE'),
});
