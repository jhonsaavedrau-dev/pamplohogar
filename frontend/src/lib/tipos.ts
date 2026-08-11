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

export interface CambioDePrecio {
  precioAnterior: number;
  precioNuevo: number;
  creadoEn: string;
}

export interface RespuestaDetalle {
  inmueble: Inmueble;
  esFavorito: boolean;
  esDueno: boolean;
  resenas: Resena[];
  cambiosDePrecio: CambioDePrecio[];
}

export type MotivoReporte =
  | 'PRECIO_ABUSIVO'
  | 'INFORMACION_FALSA'
  | 'NO_EXISTE'
  | 'NO_RESPONDE'
  | 'TRATO_IRRESPETUOSO'
  | 'OTRO';

export type EstadoReporte = 'PENDIENTE' | 'ATENDIDO' | 'DESCARTADO';

export const MOTIVOS_REPORTE: { valor: MotivoReporte; etiqueta: string; ayuda: string }[] = [
  {
    valor: 'PRECIO_ABUSIVO',
    etiqueta: 'Me cobraron mas de lo publicado',
    ayuda: 'El precio real no es el que aparece aqui',
  },
  {
    valor: 'INFORMACION_FALSA',
    etiqueta: 'La publicacion no dice la verdad',
    ayuda: 'Las fotos, el tamano o los servicios no coinciden',
  },
  {
    valor: 'NO_EXISTE',
    etiqueta: 'El inmueble no existe',
    ayuda: 'Fui a la direccion y no hay nada',
  },
  {
    valor: 'NO_RESPONDE',
    etiqueta: 'El arrendador nunca contesta',
    ayuda: 'Escribi varias veces y no hubo respuesta',
  },
  {
    valor: 'TRATO_IRRESPETUOSO',
    etiqueta: 'Me trataron mal',
    ayuda: 'Hubo groserias, discriminacion o acoso',
  },
  { valor: 'OTRO', etiqueta: 'Otra cosa', ayuda: 'Cuentanos que paso' },
];

export const ETIQUETAS_MOTIVO: Record<MotivoReporte, string> = Object.fromEntries(
  MOTIVOS_REPORTE.map((m) => [m.valor, m.etiqueta]),
) as Record<MotivoReporte, string>;

export interface ReporteAdmin {
  id: string;
  motivo: MotivoReporte;
  detalle: string;
  estado: EstadoReporte;
  creadoEn: string;
  atendidoEn: string | null;
  notaAdmin: string | null;
  atendidoPor: string | null;
  autor: { nombre: string; email: string };
  inmueble: {
    id: string;
    titulo: string;
    precio: number;
    activo: boolean;
    arrendador: { nombre: string; email: string };
  };
}

export interface RespuestaContacto {
  telefono: string;
  nombreArrendador: string;
  enlaceWhatsapp: string;
}

export interface ResumenAdmin {
  usuarios: { estudiantes: number; arrendadores: number; administradores: number };
  inmuebles: { activos: number; ocultos: number; sinFotos: number };
  actividad: { solicitudes: number; resenas: number; reportesPendientes: number };
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
