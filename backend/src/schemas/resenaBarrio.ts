import { z } from 'zod';

const estrellas = (nombre: string) =>
  z
    .number({ invalid_type_error: `Falta calificar ${nombre}.` })
    .int()
    .min(1, `Dale al menos una estrella a ${nombre}.`)
    .max(5, 'El máximo son cinco estrellas.');

export const esquemaCrearResenaBarrio = z.object({
  barrio: z.string().trim().min(3, 'Escribe el barrio.').max(60),
  tranquilidad: estrellas('la tranquilidad'),
  seguridad: estrellas('la seguridad'),
  transporte: estrellas('el transporte'),
  comentario: z
    .string()
    .trim()
    .min(20, 'Cuenta tu experiencia en el barrio en al menos 20 caracteres.')
    .max(1000, 'El comentario es demasiado largo.'),
});
