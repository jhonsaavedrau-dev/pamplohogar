export type RitmoDeVida = 'MADRUGADOR' | 'NOCTURNO' | 'MIXTO';
export type ConQuienConvivir = 'CUALQUIERA' | 'SOLO_MUJERES' | 'SOLO_HOMBRES';

export interface PerfilRoomie {
  id: string;
  presupuestoMax: number;
  descripcion: string;
  zonaPreferida: string | null;
  carrera: string | null;
  semestre: number | null;
  ritmo: RitmoDeVida;
  conQuien: ConQuienConvivir;
  fuma: boolean;
  tieneMascota: boolean;
  aceptaMascotas: boolean;
  activo: boolean;
  creadoEn: string;
  nombre: string;
  usuarioId: string;
  correoVerificado: boolean;
}

export interface RespuestaRoomies {
  perfiles: PerfilRoomie[];
  total: number;
  pagina: number;
  totalPaginas: number;
  tengoPerfil: boolean;
}

export const ETIQUETAS_RITMO: Record<RitmoDeVida, string> = {
  MADRUGADOR: 'Madrugador',
  NOCTURNO: 'Nocturno',
  MIXTO: 'Depende del día',
};

export const AYUDA_RITMO: Record<RitmoDeVida, string> = {
  MADRUGADOR: 'Me acuesto temprano y arranco temprano',
  NOCTURNO: 'Estudio de noche y me levanto tarde',
  MIXTO: 'Me acomodo, no tengo horario fijo',
};

export const ETIQUETAS_CON_QUIEN: Record<ConQuienConvivir, string> = {
  CUALQUIERA: 'Con cualquiera',
  SOLO_MUJERES: 'Solo con mujeres',
  SOLO_HOMBRES: 'Solo con hombres',
};
