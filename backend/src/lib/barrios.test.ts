import { describe, expect, it } from 'vitest';
import { claveDeBarrio } from './barrios.js';

describe('claveDeBarrio', () => {
  it('junta el mismo barrio escrito de varias formas', () => {
    const esperada = claveDeBarrio('El Buque');
    expect(claveDeBarrio('el buque')).toBe(esperada);
    expect(claveDeBarrio('EL BUQUE')).toBe(esperada);
    expect(claveDeBarrio('  El   Buque  ')).toBe(esperada);
  });

  it('ignora los acentos y la ene', () => {
    expect(claveDeBarrio('Ursúa')).toBe(claveDeBarrio('Ursua'));
    expect(claveDeBarrio('La Peñita')).toBe(claveDeBarrio('la penita'));
  });

  it('trata los guiones y puntos como separacion', () => {
    expect(claveDeBarrio('Juan XXIII')).toBe('juan xxiii');
    expect(claveDeBarrio('San-Francisco')).toBe('san francisco');
    expect(claveDeBarrio('Cristo Rey.')).toBe('cristo rey');
  });

  it('no junta barrios que de verdad son distintos', () => {
    expect(claveDeBarrio('El Escorial')).not.toBe(claveDeBarrio('El Buque'));
    expect(claveDeBarrio('Santa Marta')).not.toBe(claveDeBarrio('Santa Ana'));
  });

  it('devuelve vacio cuando no queda nada aprovechable', () => {
    // La ruta usa esto para rechazar un barrio escrito solo con simbolos.
    expect(claveDeBarrio('---')).toBe('');
    expect(claveDeBarrio('   ')).toBe('');
  });
});
