import { z } from 'zod';

const telefonoColombiano = z
  .string()
  .trim()
  .regex(/^3\d{9}$/, 'El celular debe tener 10 digitos y empezar por 3.');

export const esquemaRegistro = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Escribe tu nombre completo.')
    .max(80, 'El nombre es demasiado largo.'),
  email: z.string().trim().toLowerCase().email('Escribe un correo valido.'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres.')
    .max(72, 'La contrasena es demasiado larga.'),
  telefono: telefonoColombiano.optional(),
  rol: z.enum(['ESTUDIANTE', 'ARRENDADOR'], {
    errorMap: () => ({ message: 'Elige si eres estudiante o arrendador.' }),
  }),
});

export const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo valido.'),
  password: z.string().min(1, 'Escribe tu contrasena.'),
});

export const esquemaActualizarPerfil = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre completo.').max(80).optional(),
  telefono: telefonoColombiano.optional(),
});

export const esquemaPedirRecuperacion = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo valido.'),
});

export const esquemaRestablecerClave = z.object({
  token: z.string().min(1, 'Falta el codigo del enlace.'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres.')
    .max(72, 'La contrasena es demasiado larga.'),
});

export const esquemaConfirmarCorreo = z.object({
  token: z.string().min(1, 'Falta el codigo del enlace.'),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;
