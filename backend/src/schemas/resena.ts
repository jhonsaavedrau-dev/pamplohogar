import { z } from 'zod';

export const esquemaCrearResena = z.object({
  inmuebleId: z.string().min(1, 'Falta indicar el inmueble.'),
  calificacion: z
    .number({ invalid_type_error: 'Elige cuántas estrellas le das.' })
    .int()
    .min(1, 'Mínimo una estrella.')
    .max(5, 'Máximo cinco estrellas.'),
  comentario: z
    .string()
    .trim()
    .min(15, 'Cuenta tu experiencia en al menos 15 caracteres.')
    .max(1000, 'El comentario es demasiado largo.'),
});
