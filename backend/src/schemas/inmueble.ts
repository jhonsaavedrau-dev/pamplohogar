import { z } from 'zod';

export const SERVICIOS = [
  'wifi',
  'agua',
  'luz',
  'gas',
  'cocina',
  'lavadora',
  'banoPrivado',
  'parqueadero',
  'vigilancia',
  'mascotas',
  'estudio',
  'television',
] as const;

export const TIPOS = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'] as const;

const esquemaFoto = z.object({
  url: z.string().url('La foto no tiene una dirección valida.'),
  publicId: z.string().min(1),
});

export const esquemaCrearInmueble = z.object({
  titulo: z
    .string()
    .trim()
    .min(10, 'El titulo debe tener al menos 10 caracteres.')
    .max(120, 'El titulo es demasiado largo.'),
  descripcion: z
    .string()
    .trim()
    .min(30, 'Cuenta un poco mas del inmueble, mínimo 30 caracteres.')
    .max(2000, 'La descripción es demasiado larga.'),
  tipo: z.enum(TIPOS, { errorMap: () => ({ message: 'Elige el tipo de inmueble.' }) }),
  precio: z
    .number({ invalid_type_error: 'El precio debe ser un número.' })
    .int('El precio debe ser un número entero.')
    .min(50000, 'El precio mínimo es 50.000 pesos.')
    .max(10000000, 'El precio máximo es 10.000.000 de pesos.'),
  barrio: z.string().trim().min(3, 'Escribe el barrio.').max(60),
  direccion: z.string().trim().min(5, 'Escribe la dirección.').max(160),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  habitaciones: z.number().int().min(1, 'Mínimo 1 habitación.').max(20),
  banos: z.number().int().min(1, 'Mínimo 1 baño.').max(20),
  servicios: z.array(z.enum(SERVICIOS)).max(SERVICIOS.length).default([]),
  amoblado: z.boolean().default(false),
  fotos: z.array(esquemaFoto).max(10, 'Máximo 10 fotos por inmueble.').default([]),
});

export const esquemaActualizarInmueble = esquemaCrearInmueble.partial().extend({
  activo: z.boolean().optional(),
});

const numeroOpcional = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
  .refine((v) => v === undefined || Number.isFinite(v), 'Valor numerico invalido.');

export const esquemaBusqueda = z.object({
  q: z.string().trim().max(120).optional(),
  tipo: z.enum(TIPOS).optional(),
  barrio: z.string().trim().max(60).optional(),
  precioMin: numeroOpcional,
  precioMax: numeroOpcional,
  habitaciones: numeroOpcional,
  amoblado: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v === 'true')),
  servicios: z
    .string()
    .optional()
    .transform((v) =>
      v === undefined || v.trim() === '' ? undefined : v.split(',').map((s) => s.trim()),
    ),
  orden: z.enum(['recientes', 'precioAsc', 'precioDesc', 'cercania']).default('recientes'),
  pagina: z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined || v === '' ? 1 : Number(v);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    }),
});

export type DatosCrearInmueble = z.infer<typeof esquemaCrearInmueble>;
export type FiltrosBusqueda = z.infer<typeof esquemaBusqueda>;
