import { describe, expect, it } from 'vitest';
import {
  FALLOS_PERMITIDOS,
  MINUTOS_DE_FRENO,
  revisarFreno,
  siguienteEstadoTrasFallo,
} from './intentosDeEntrada.js';

const AHORA = new Date('2026-08-12T10:00:00.000Z');
const enMinutos = (m: number) => new Date(AHORA.getTime() + m * 60000);

describe('revisarFreno', () => {
  it('deja pasar a quien nunca ha sido frenado', () => {
    expect(revisarFreno(null, AHORA).frenada).toBe(false);
  });

  it('deja pasar cuando el freno ya vencio', () => {
    expect(revisarFreno(enMinutos(-1), AHORA).frenada).toBe(false);
  });

  it('frena y dice cuantos minutos faltan', () => {
    const r = revisarFreno(enMinutos(15), AHORA);
    expect(r.frenada).toBe(true);
    expect(r.minutosQueFaltan).toBe(15);
  });

  it('nunca dice que falta cero minutos', () => {
    // Si faltan diez segundos, decir "espera 0 minutos" no ayuda a nadie.
    const r = revisarFreno(new Date(AHORA.getTime() + 10000), AHORA);
    expect(r.frenada).toBe(true);
    expect(r.minutosQueFaltan).toBe(1);
  });
});

describe('siguienteEstadoTrasFallo', () => {
  it('solo cuenta mientras no se llegue al tope', () => {
    const r = siguienteEstadoTrasFallo(0, AHORA);
    expect(r.intentosFallidos).toBe(1);
    expect(r.bloqueadoHasta).toBeNull();
  });

  it('todavia no frena en el intento anterior al tope', () => {
    const r = siguienteEstadoTrasFallo(FALLOS_PERMITIDOS - 2, AHORA);
    expect(r.intentosFallidos).toBe(FALLOS_PERMITIDOS - 1);
    expect(r.bloqueadoHasta).toBeNull();
  });

  it('frena justo al llegar al tope', () => {
    const r = siguienteEstadoTrasFallo(FALLOS_PERMITIDOS - 1, AHORA);
    expect(r.bloqueadoHasta).toEqual(enMinutos(MINUTOS_DE_FRENO));
  });

  it('vuelve el contador a cero al frenar', () => {
    // Si no, al vencer los quince minutos la persona quedaria a un solo error
    // de que la frenen otra vez.
    const r = siguienteEstadoTrasFallo(FALLOS_PERMITIDOS - 1, AHORA);
    expect(r.intentosFallidos).toBe(0);
  });
});
