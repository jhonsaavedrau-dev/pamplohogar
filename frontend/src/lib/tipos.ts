export type Rol = 'ESTUDIANTE' | 'ARRENDADOR' | 'ADMIN';

export type TipoInmueble = 'HABITACION' | 'APARTAESTUDIO' | 'APARTAMENTO' | 'CASA';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  creadoEn: string;
}

export interface Foto {
  id: string;
  url: string;
  publicId: string;
}

export interface ArrendadorResumen {
  id: string;
  nombre: string;
  calificacionPromedio: number;
  totalResenas: number;
}

export interface Inmueble {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoInmueble;
  precio: number;
  barrio: string;
  direccion: string;
  lat: number;
  lng: number;
  habitaciones: number;
  banos: number;
  servicios: string[];
  amoblado: boolean;
  activo: boolean;
  creadoEn: string;
  distanciaUniversidadKm: number;
  fotos: Foto[];
  arrendador: ArrendadorResumen;
}

export interface Resena {
  id: string;
  calificacion: number;
  comentario: string;
  creadoEn: string;
  autor: string;
}

export interface RespuestaListado {
  inmuebles: Inmueble[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface RespuestaDetalle {
  inmueble: Inmueble;
  esFavorito: boolean;
  esDueno: boolean;
  resenas: Resena[];
}

export interface RespuestaContacto {
  telefono: string;
  nombreArrendador: string;
  enlaceWhatsapp: string;
}

export interface ResumenAdmin {
  usuarios: { estudiantes: number; arrendadores: number; administradores: number };
  inmuebles: { activos: number; ocultos: number; sinFotos: number };
  actividad: { solicitudes: number; resenas: number };
  precios: { mediana: number; minimo: number; maximo: number; inusuales: number };
}

export interface InmuebleAdmin {
  id: string;
  titulo: string;
  tipo: TipoInmueble;
  precio: number;
  barrio: string;
  activo: boolean;
  creadoEn: string;
  arrendador: { id: string; nombre: string; email: string };
  fotos: number;
  solicitudes: number;
  favoritos: number;
  precioInusual: boolean;
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  creadoEn: string;
  inmuebles: number;
  resenas: number;
}

export interface ResenaAdmin {
  id: string;
  calificacion: number;
  comentario: string;
  creadoEn: string;
  autor: string;
  sobre: string;
}

export const ETIQUETAS_TIPO: Record<TipoInmueble, string> = {
  HABITACION: 'Habitacion',
  APARTAESTUDIO: 'Apartaestudio',
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
};

export const ETIQUETAS_SERVICIO: Record<string, string> = {
  wifi: 'Wifi',
  agua: 'Agua incluida',
  luz: 'Luz incluida',
  gas: 'Gas',
  cocina: 'Cocina',
  lavadora: 'Lavadora',
  banoPrivado: 'Bano privado',
  parqueadero: 'Parqueadero',
  vigilancia: 'Vigilancia',
  mascotas: 'Acepta mascotas',
  estudio: 'Zona de estudio',
  television: 'Television',
};

export const SERVICIOS_DISPONIBLES = Object.keys(ETIQUETAS_SERVICIO);
