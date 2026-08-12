import { z } from 'zod';
import { SERVICIOS, TIPOS } from './inmueble.js';

export const esquemaGuardarBusqueda = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Ponle un nombre para reconocerla después.')
    .max(60, 'El nombre es demasiado largo.'),
  avisarPorCorreo: z.boolean().default(true),
  q: z.string().trim().max(120).optional(),
  tipo: z.enum(TIPOS).optional(),
  barrio: z.string().trim().max(60).optional(),
  precioMin: z.number().int().min(0).max(10000000).optional(),
  precioMax: z.number().int().min(0).max(10000000).optional(),
  habitaciones: z.number().int().min(1).max(20).optional(),
  amoblado: z.boolean().optional(),
  servicios: z.array(z.enum(SERVICIOS)).max(SERVICIOS.length).default([]),
});

export const esquemaActualizarBusqueda = z.object({
  nombre: z.string().trim().min(3).max(60).optional(),
  avisarPorCorreo: z.boolean().optional(),
});
