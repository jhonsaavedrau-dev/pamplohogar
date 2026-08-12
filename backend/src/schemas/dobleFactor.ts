import { z } from 'zod';

const codigo = z
  .string()
  .trim()
  .min(6, 'El código va de seis dígitos.')
  .max(20, 'Ese código es demasiado largo.');

export const esquemaPrepararDobleFactor = z.object({
  metodo: z.enum(['APP', 'CORREO'], {
    errorMap: () => ({ message: 'Elige si el código llega por app o por correo.' }),
  }),
});

export const esquemaActivarDobleFactor = z.object({ codigo });

export const esquemaApagarDobleFactor = z.object({
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export const esquemaCodigoDeEntrada = z.object({
  paseIntermedio: z.string().min(1, 'Vuelve a escribir tu correo y contraseña.'),
  // Aqui tambien entran los de respaldo, que son mas largos y llevan guion.
  codigo: z.string().trim().min(6, 'Escribe el código.').max(20, 'Ese código es demasiado largo.'),
});
