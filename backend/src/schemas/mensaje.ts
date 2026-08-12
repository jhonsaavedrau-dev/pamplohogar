import { z } from 'zod';

export const esquemaAbrirConversacion = z.object({
  inmuebleId: z.string().min(1, 'Falta indicar el inmueble.'),
});

export const esquemaEnviarMensaje = z.object({
  texto: z
    .string()
    .trim()
    .min(1, 'Escribe algo antes de enviar.')
    .max(2000, 'El mensaje es demasiado largo. Mándalo en dos partes.'),
});
