import { z } from 'zod';

export const RITMOS = ['MADRUGADOR', 'NOCTURNO', 'MIXTO'] as const;
export const CON_QUIEN = ['CUALQUIERA', 'SOLO_MUJERES', 'SOLO_HOMBRES'] as const;

export const esquemaPerfilRoomie = z.object({
  presupuestoMax: z
    .number({ invalid_type_error: 'Escribe cuánto puedes poner al mes.' })
    .int('Escribe un número entero.')
    .min(50000, 'El presupuesto mínimo es 50.000 pesos.')
    .max(5000000, 'Ese presupuesto se sale de lo normal en Pamplona.'),
  descripcion: z
    .string()
    .trim()
    .min(40, 'Cuenta un poco de ti en al menos 40 caracteres. Nadie escribe a un perfil vacío.')
    .max(1000, 'La descripción es demasiado larga.'),
  zonaPreferida: z.string().trim().max(60).optional(),
  carrera: z.string().trim().max(60).optional(),
  semestre: z.number().int().min(1, 'Mínimo primer semestre.').max(14).optional(),
  ritmo: z.enum(RITMOS).default('MIXTO'),
  conQuien: z.enum(CON_QUIEN).default('CUALQUIERA'),
  fuma: z.boolean().default(false),
  tieneMascota: z.boolean().default(false),
  aceptaMascotas: z.boolean().default(true),
  activo: z.boolean().default(true),
});

const numeroOpcional = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
  .refine((v) => v === undefined || Number.isFinite(v), 'Valor numérico inválido.');

export const esquemaBuscarRoomies = z.object({
  presupuestoMin: numeroOpcional,
  presupuestoMax: numeroOpcional,
  zona: z.string().trim().max(60).optional(),
  ritmo: z.enum(RITMOS).optional(),
  aceptaMascotas: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v === 'true')),
  sinFumadores: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v === 'true')),
  pagina: z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined || v === '' ? 1 : Number(v);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    }),
});
