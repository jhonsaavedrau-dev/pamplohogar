import { describe, expect, it } from 'vitest';
import {
  aBase32,
  claveNueva,
  codigoDe,
  codigosDeRespaldo,
  CUANTOS_CODIGOS_DE_RESPALDO,
  desdeBase32,
  direccionParaLaApp,
  pasoActual,
  revisarCodigo,
} from './dobleFactor.js';

describe('base32', () => {
  it('va y vuelve sin perder nada', () => {
    const original = Buffer.from('PamploHogar en Pamplona');
    expect(desdeBase32(aBase32(original)).equals(original)).toBe(true);
  });

  it('coincide con los ejemplos del estandar', () => {
    // Los de la RFC 4648, sin el relleno de iguales que las apps no usan.
    expect(aBase32(Buffer.from('f'))).toBe('MY');
    expect(aBase32(Buffer.from('fo'))).toBe('MZXQ');
    expect(aBase32(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
  });

  it('ignora espacios y minusculas al leer', () => {
    const clave = aBase32(Buffer.from('hola'));
    const sucia = clave.toLowerCase().replace(/(.{2})/g, '$1 ');
    expect(desdeBase32(sucia).equals(desdeBase32(clave))).toBe(true);
  });
});

describe('codigoDe', () => {
  // Clave del ejemplo de la RFC 6238: los veinte bytes "12345678901234567890".
  const CLAVE = aBase32(Buffer.from('12345678901234567890'));

  it('da los codigos que dice el estandar', () => {
    // Si esto se rompe, las apps de autenticacion dejarian de servir.
    expect(codigoDe(CLAVE, Math.floor(59 / 30))).toBe('287082');
    expect(codigoDe(CLAVE, Math.floor(1111111109 / 30))).toBe('081804');
    expect(codigoDe(CLAVE, Math.floor(1234567890 / 30))).toBe('005924');
  });

  it('siempre da seis digitos', () => {
    for (let paso = 0; paso < 200; paso++) {
      expect(codigoDe(CLAVE, paso)).toMatch(/^\d{6}$/);
    }
  });

  it('cambia de un paso al siguiente', () => {
    expect(codigoDe(CLAVE, 100)).not.toBe(codigoDe(CLAVE, 101));
  });

  it('dos personas distintas no comparten codigo', () => {
    const paso = pasoActual(new Date('2026-08-12T10:00:00Z'));
    expect(codigoDe(claveNueva(), paso)).not.toBe(codigoDe(claveNueva(), paso));
  });
});

describe('revisarCodigo', () => {
  const CLAVE = claveNueva();
  const AHORA = new Date('2026-08-12T10:00:00.000Z');
  const PASO = pasoActual(AHORA);

  it('acepta el codigo del momento', () => {
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO), AHORA, null)).toEqual({ estado: 'bueno', paso: PASO });
  });

  it('perdona un reloj atrasado o adelantado treinta segundos', () => {
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO - 1), AHORA, null)).toEqual({
      estado: 'bueno',
      paso: PASO - 1,
    });
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO + 1), AHORA, null)).toEqual({
      estado: 'bueno',
      paso: PASO + 1,
    });
  });

  it('no perdona un reloj muy desfasado', () => {
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO - 5), AHORA, null).estado).toBe('malo');
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO + 5), AHORA, null).estado).toBe('malo');
  });

  it('rechaza un codigo inventado', () => {
    expect(revisarCodigo(CLAVE, '000000', AHORA, null).estado).toBe('malo');
    expect(revisarCodigo(CLAVE, '123456', AHORA, null).estado).toBe('malo');
  });

  it('rechaza lo que no sean seis digitos', () => {
    expect(revisarCodigo(CLAVE, '12345', AHORA, null).estado).toBe('malo');
    expect(revisarCodigo(CLAVE, '1234567', AHORA, null).estado).toBe('malo');
    expect(revisarCodigo(CLAVE, 'abcdef', AHORA, null).estado).toBe('malo');
  });

  it('no deja usar dos veces el mismo codigo', () => {
    // Alguien que lo alcance a ver por encima del hombro no lo puede repetir.
    const codigo = codigoDe(CLAVE, PASO);
    const primero = revisarCodigo(CLAVE, codigo, AHORA, null);
    expect(primero).toEqual({ estado: 'bueno', paso: PASO });
    // Y se distingue de un codigo inventado, para poder decirle a la persona
    // que espere al siguiente en vez de que revise digito por digito.
    expect(revisarCodigo(CLAVE, codigo, AHORA, PASO).estado).toBe('yaUsado');
  });

  it('tampoco deja volver a uno anterior ya usado', () => {
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO - 1), AHORA, PASO).estado).toBe('yaUsado');
  });

  it('sigue aceptando el siguiente despues de usar uno', () => {
    const despues = new Date(AHORA.getTime() + 30000);
    expect(revisarCodigo(CLAVE, codigoDe(CLAVE, PASO + 1), despues, PASO)).toEqual({
      estado: 'bueno',
      paso: PASO + 1,
    });
  });
});

describe('direccionParaLaApp', () => {
  it('lleva la clave, el nombre y el correo', () => {
    const d = direccionParaLaApp('ABCDEF', 'marta@ejemplo.com');
    expect(d.startsWith('otpauth://totp/')).toBe(true);
    expect(d).toContain('secret=ABCDEF');
    expect(d).toContain('issuer=PamploHogar');
    expect(d).toContain(encodeURIComponent('marta@ejemplo.com'));
  });
});

describe('codigosDeRespaldo', () => {
  it('da ocho, todos distintos', () => {
    const codigos = codigosDeRespaldo();
    expect(codigos).toHaveLength(CUANTOS_CODIGOS_DE_RESPALDO);
    expect(new Set(codigos).size).toBe(CUANTOS_CODIGOS_DE_RESPALDO);
  });

  it('no se repiten entre dos personas', () => {
    const unos = codigosDeRespaldo();
    const otros = codigosDeRespaldo();
    expect(unos.some((c) => otros.includes(c))).toBe(false);
  });
});
