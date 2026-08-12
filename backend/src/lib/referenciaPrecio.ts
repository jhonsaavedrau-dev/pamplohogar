import type { TipoInmueble } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Con cuantos inmuebles parecidos vale la pena hablar de "lo normal".
 *
 * Con dos o tres, la mediana no dice nada y un numero inventado con aire de
 * dato es peor que no mostrar nada: el estudiante negociaria con una cifra
 * falsa.
 */
const MUESTRA_MINIMA = 4;

/** A partir de cuanto se considera que el precio se sale de lo normal. */
const MARGEN = 0.15;

export interface ReferenciaDePrecio {
  mediana: number;
  muestras: number;
  ambito: 'barrio' | 'ciudad';
  diferenciaPorcentaje: number;
  veredicto: 'porEncima' | 'porDebajo' | 'enLoNormal';
}

/**
 * Se usa la mediana y no el promedio a proposito: un solo inmueble de diez
 * millones publicado por error arrastra el promedio y le diria a todo el
 * mundo que su arriendo esta barato.
 */
export function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? Math.round((ordenados[medio - 1] + ordenados[medio]) / 2)
    : ordenados[medio];
}

/**
 * La cuenta pura, aparte de la base de datos, para poder probarla sola.
 * Devuelve null cuando no hay con que comparar de forma honesta.
 */
export function compararConPrecios(
  precio: number,
  precios: number[],
  ambito: 'barrio' | 'ciudad',
): ReferenciaDePrecio | null {
  if (precios.length < MUESTRA_MINIMA) return null;

  const referencia = mediana(precios);
  if (referencia <= 0) return null;

  const diferencia = (precio - referencia) / referencia;

  return {
    mediana: referencia,
    muestras: precios.length,
    ambito,
    diferenciaPorcentaje: Math.round(diferencia * 100),
    veredicto:
      diferencia > MARGEN ? 'porEncima' : diferencia < -MARGEN ? 'porDebajo' : 'enLoNormal',
  };
}

/**
 * Con que se compara este inmueble.
 *
 * Primero contra los del mismo tipo en el mismo barrio, que es la comparacion
 * que de verdad le sirve a alguien. Si en ese barrio hay muy pocos, se abre a
 * toda la ciudad y se dice claramente que la referencia cambio.
 */
export async function referenciaDePrecio(
  inmuebleId: string,
  tipo: TipoInmueble,
  barrio: string,
  precio: number,
): Promise<ReferenciaDePrecio | null> {
  const comunes = {
    activo: true,
    tipo,
    id: { not: inmuebleId },
  };

  const enBarrio = await prisma.inmueble.findMany({
    where: { ...comunes, barrio: { equals: barrio, mode: 'insensitive' } },
    select: { precio: true },
  });

  let precios = enBarrio.map((i) => i.precio);
  let ambito: 'barrio' | 'ciudad' = 'barrio';

  if (precios.length < MUESTRA_MINIMA) {
    const enCiudad = await prisma.inmueble.findMany({
      where: comunes,
      select: { precio: true },
    });
    precios = enCiudad.map((i) => i.precio);
    ambito = 'ciudad';
  }

  return compararConPrecios(precio, precios, ambito);
}
