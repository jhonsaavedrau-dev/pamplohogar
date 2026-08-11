import { describe, expect, it } from 'vitest';
import { UNIVERSIDAD_PAMPLONA, distanciaAUniversidad, distanciaKm } from './geo.js';

describe('distanciaKm', () => {
  it('devuelve cero para el mismo punto', () => {
    expect(distanciaKm(7.3768, -72.6474, 7.3768, -72.6474)).toBe(0);
  });

  it('calcula una distancia conocida entre Bogota y Medellin', () => {
    // Distancia real en linea recta: alrededor de 240 km.
    const km = distanciaKm(4.711, -74.0721, 6.2442, -75.5812);
    expect(km).toBeGreaterThan(230);
    expect(km).toBeLessThan(250);
  });

  it('es simetrica', () => {
    const ida = distanciaKm(7.3768, -72.6474, 7.3697, -72.6516);
    const vuelta = distanciaKm(7.3697, -72.6516, 7.3768, -72.6474);
    expect(ida).toBeCloseTo(vuelta, 10);
  });

  it('un grado de latitud equivale a unos 111 km', () => {
    const km = distanciaKm(7, -72.65, 8, -72.65);
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });
});

describe('distanciaAUniversidad', () => {
  it('es cero en la propia universidad', () => {
    const km = distanciaAUniversidad(UNIVERSIDAD_PAMPLONA.lat, UNIVERSIDAD_PAMPLONA.lng);
    expect(km).toBe(0);
  });

  it('un inmueble del centro de Pamplona queda a menos de dos kilometros', () => {
    expect(distanciaAUniversidad(7.3768, -72.6474)).toBeLessThan(2);
  });

  it('un inmueble en Bogota queda lejisimos', () => {
    expect(distanciaAUniversidad(4.711, -74.0721)).toBeGreaterThan(300);
  });
});
