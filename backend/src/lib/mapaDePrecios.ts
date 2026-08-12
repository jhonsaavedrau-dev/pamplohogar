import type { TipoInmueble } from '@prisma/client';
import { prisma } from './prisma.js';
import { claveDeBarrio } from './barrios.js';
import { mediana } from './referenciaPrecio.js';

/**
 * Cuantos inmuebles necesita un barrio para aparecer en el mapa.
 *
 * Con uno o dos, el color del barrio lo decide un solo arrendador. Alguien
 * planeando su semestre veria "esta zona es cara" cuando lo unico que hay es
 * una publicacion con el precio inflado.
 */
const MINIMO_POR_BARRIO = 3;

/**
 * Desde cuanto se considera que una zona se sale de lo normal de la ciudad.
 *
 * Es mas estrecho que el 15 por ciento que se usa al juzgar un inmueble
 * suelto, y a proposito. Decir "en esta zona se suele cobrar mas" es una
 * afirmacion suave sobre un promedio; senalar una publicacion concreta es
 * casi una acusacion, y ahi conviene ser mas prudente. Ademas, un diez por
 * ciento de un arriendo son unos treinta mil pesos al mes: para un estudiante
 * contando la plata, eso ya es una diferencia que vale la pena ver.
 */
const MARGEN = 0.1;

export type NivelDePrecio = 'barato' | 'normal' | 'caro';

export interface ZonaDelMapa {
  barrio: string;
  lat: number;
  lng: number;
  mediana: number;
  inmuebles: number;
  nivel: NivelDePrecio;
  diferenciaPorcentaje: number;
}

/**
 * Un inmueble suelto en el mapa.
 *
 * Se muestran ademas de los circulos de zona porque al principio casi ningun
 * barrio va a tener tres publicaciones, y un mapa vacio no le sirve a nadie.
 * Un punto dice "aqui hay esto por este precio", que es un dato cierto,
 * mientras que un circulo dice "asi es esta zona", que solo se puede afirmar
 * con varios.
 */
export interface PuntoDelMapa {
  id: string;
  titulo: string;
  barrio: string;
  lat: number;
  lng: number;
  precio: number;
  nivel: NivelDePrecio;
}

export interface MapaDePrecios {
  tipo: TipoInmueble;
  medianaDeLaCiudad: number;
  minimoPorBarrio: number;
  zonas: ZonaDelMapa[];
  puntos: PuntoDelMapa[];
  /** Barrios con publicaciones pero con muy pocas para pintarlos. */
  barriosConPocosDatos: string[];
}

const promedio = (valores: number[]): number =>
  valores.reduce((a, b) => a + b, 0) / valores.length;

/**
 * Precio tipico por barrio para un tipo de inmueble.
 *
 * Se pide un tipo y no se mezclan todos a proposito: una habitacion y una casa
 * completa no compiten por el mismo estudiante, y promediarlas pintaria de
 * "caro" cualquier barrio donde alguien publico una casa grande.
 */
export async function mapaDePrecios(tipo: TipoInmueble): Promise<MapaDePrecios> {
  const inmuebles = await prisma.inmueble.findMany({
    where: { activo: true, tipo },
    select: { id: true, titulo: true, barrio: true, precio: true, lat: true, lng: true },
  });

  const porBarrio = new Map<
    string,
    { barrio: string; precios: number[]; lats: number[]; lngs: number[] }
  >();

  for (const i of inmuebles) {
    const clave = claveDeBarrio(i.barrio);
    if (!clave) continue;
    const grupo = porBarrio.get(clave) ?? { barrio: i.barrio, precios: [], lats: [], lngs: [] };
    grupo.precios.push(i.precio);
    grupo.lats.push(i.lat);
    grupo.lngs.push(i.lng);
    porBarrio.set(clave, grupo);
  }

  const medianaDeLaCiudad = inmuebles.length > 0 ? mediana(inmuebles.map((i) => i.precio)) : 0;

  const nivelDe = (precio: number): NivelDePrecio => {
    if (medianaDeLaCiudad <= 0) return 'normal';
    const diferencia = (precio - medianaDeLaCiudad) / medianaDeLaCiudad;
    return diferencia > MARGEN ? 'caro' : diferencia < -MARGEN ? 'barato' : 'normal';
  };

  const zonas: ZonaDelMapa[] = [];
  const barriosConPocosDatos: string[] = [];

  for (const grupo of porBarrio.values()) {
    if (grupo.precios.length < MINIMO_POR_BARRIO) {
      barriosConPocosDatos.push(grupo.barrio);
      continue;
    }

    const tipica = mediana(grupo.precios);
    const diferencia = medianaDeLaCiudad > 0 ? (tipica - medianaDeLaCiudad) / medianaDeLaCiudad : 0;


    zonas.push({
      barrio: grupo.barrio,
      // El centro de la zona es el promedio de donde estan los inmuebles, no
      // el centro oficial del barrio: asi el circulo cae donde de verdad hay
      // algo publicado.
      lat: promedio(grupo.lats),
      lng: promedio(grupo.lngs),
      mediana: tipica,
      inmuebles: grupo.precios.length,
      diferenciaPorcentaje: Math.round(diferencia * 100),
      nivel: nivelDe(tipica),
    });
  }

  zonas.sort((a, b) => a.mediana - b.mediana);
  barriosConPocosDatos.sort((a, b) => a.localeCompare(b, 'es'));

  return {
    tipo,
    medianaDeLaCiudad,
    minimoPorBarrio: MINIMO_POR_BARRIO,
    zonas,
    puntos: inmuebles.map((i) => ({
      id: i.id,
      titulo: i.titulo,
      barrio: i.barrio,
      lat: i.lat,
      lng: i.lng,
      precio: i.precio,
      nivel: nivelDe(i.precio),
    })),
    barriosConPocosDatos,
  };
}
