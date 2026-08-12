import 'dotenv/config';
import { z } from 'zod';

const esquemaEnv = z.object({
  DATABASE_URL: z.string().min(1, 'Falta DATABASE_URL'),
  DIRECT_URL: z.string().min(1, 'Falta DIRECT_URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  RESEND_API_KEY: z.string().optional().default(''),
  CORREO_REMITENTE: z.string().optional().default('PamploHogar <onboarding@resend.dev>'),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  const detalles = resultado.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Configuración invalida en el archivo .env:\n${detalles}`);
}

export const env = resultado.data;

export const cloudinaryConfigurado =
  env.CLOUDINARY_CLOUD_NAME !== '' &&
  env.CLOUDINARY_API_KEY !== '' &&
  env.CLOUDINARY_API_SECRET !== '';

/** Origenes permitidos por CORS. Acepta varias URLs separadas por coma. */
export const origenesPermitidos = env.FRONTEND_URL.split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter((u) => u.length > 0);
