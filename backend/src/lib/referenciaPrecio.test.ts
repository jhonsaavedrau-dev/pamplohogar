import { describe, expect, it } from 'vitest';
import { compararConPrecios, mediana } from './referenciaPrecio.js';

describe('mediana', () => {
  it('toma el valor de la mitad cuando la cantidad es impar', () => {
    expect(mediana([300000, 250000, 400000])).toBe(300000);
  });

  it('promedia los dos del medio cuando la cantidad es par', () => {
    expect(mediana([250000, 300000, 400000, 500000])).toBe(350000);
  });

  it('no se deja arrastrar por un precio absurdo', () => {
    // Alguien publica diez millones por error. El promedio seria 2.362.500 y
    // le diria a todo Pamplona que su arriendo esta baratisimo.
    const precios = [300000, 320000, 350000, 10000000];
    expect(mediana(precios)).toBe(335000);
  });

  it('no altera el arreglo que recibe', () => {
    const precios = [400000, 200000, 300000];
    mediana(precios);
    expect(precios).toEqual([400000, 200000, 300000]);
  });
});

describe('compararConPrecios', () => {
  const cuatro = [300000, 320000, 340000, 360000]; // mediana 330.000

  it('no dice nada cuando hay menos de cuatro parecidos', () => {
    expect(compararConPrecios(400000, [300000, 320000, 340000], 'barrio')).toBeNull();
  });

  it('avisa cuando el precio esta claramente por encima', () => {
    const r = compararConPrecios(450000, cuatro, 'barrio');
    expect(r?.veredicto).toBe('porEncima');
    expect(r?.diferenciaPorcentaje).toBe(36);
    expect(r?.mediana).toBe(330000);
    expect(r?.muestras).toBe(4);
  });

  it('avisa cuando el precio esta claramente por debajo', () => {
    const r = compararConPrecios(250000, cuatro, 'ciudad');
    expect(r?.veredicto).toBe('porDebajo');
    expect(r?.ambito).toBe('ciudad');
  });

  it('trata como normal una diferencia pequena', () => {
    expect(compararConPrecios(345000, cuatro, 'barrio')?.veredicto).toBe('enLoNormal');
    expect(compararConPrecios(320000, cuatro, 'barrio')?.veredicto).toBe('enLoNormal');
  });

  it('deja el 15 por ciento justo dentro de lo normal', () => {
    // El margen se pasa cuando se supera, no cuando se iguala: a nadie se le
    // acusa de cobrar de mas por estar exactamente en el limite.
    expect(compararConPrecios(379500, cuatro, 'barrio')?.veredicto).toBe('enLoNormal');
    expect(compararConPrecios(280500, cuatro, 'barrio')?.veredicto).toBe('enLoNormal');
  });

  it('no divide por cero si todos los parecidos valen cero', () => {
    expect(compararConPrecios(300000, [0, 0, 0, 0], 'ciudad')).toBeNull();
  });
});
