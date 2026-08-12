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
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña es demasiado larga.'),
  // El celular ya no se pide al registrarse. Solo hace falta para publicar, y
  // pedirlo antes es una pregunta mas en la puerta de entrada.
  telefono: z.union([telefonoColombiano, z.literal('')]).optional(),
  rol: z.enum(['ESTUDIANTE', 'ARRENDADOR'], {
    errorMap: () => ({ message: 'Elige si eres estudiante o arrendador.' }),
  }),
});

export const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo valido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export const esquemaActualizarPerfil = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre completo.').max(80).optional(),
  // Cadena vacia quiere decir "quitalo", que es distinto de "no lo toques".
  telefono: z.union([telefonoColombiano, z.literal('')]).optional(),
  descripcion: z
    .string()
    .trim()
    .max(400, 'Cuéntalo en menos de 400 caracteres.')
    .optional(),
  foto: z.union([z.string().url('Esa no parece una dirección de foto.'), z.literal('')]).optional(),
  fotoId: z.string().max(200).optional(),
});

export const esquemaPedirRecuperacion = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo valido.'),
});

export const esquemaRestablecerClave = z.object({
  token: z.string().min(1, 'Falta el código del enlace.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña es demasiado larga.'),
});

export const esquemaConfirmarCorreo = z.object({
  token: z.string().min(1, 'Falta el código del enlace.'),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;
