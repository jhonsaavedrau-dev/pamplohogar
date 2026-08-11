import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { firmarToken, verificarToken } from './jwt.js';

describe('firmarToken y verificarToken', () => {
  it('recupera el usuario y el rol que se firmaron', () => {
    const token = firmarToken({ sub: 'usuario-123', rol: 'ARRENDADOR' });
    const payload = verificarToken(token);
    expect(payload).toEqual({ sub: 'usuario-123', rol: 'ARRENDADOR' });
  });

  it('rechaza un token inventado', () => {
    expect(verificarToken('esto.no.es-un-token')).toBeNull();
  });

  it('rechaza un token firmado con otro secreto', () => {
    const intruso = jwt.sign({ sub: 'usuario-123', rol: 'ADMIN' }, 'secreto-del-atacante');
    expect(verificarToken(intruso)).toBeNull();
  });

  it('rechaza un token manipulado', () => {
    const token = firmarToken({ sub: 'usuario-123', rol: 'ESTUDIANTE' });
    const partes = token.split('.');
    const cargaFalsa = Buffer.from(
      JSON.stringify({ sub: 'usuario-123', rol: 'ADMIN' }),
    ).toString('base64url');
    expect(verificarToken(`${partes[0]}.${cargaFalsa}.${partes[2]}`)).toBeNull();
  });

  it('rechaza un token con un rol que no existe', () => {
    const raro = jwt.sign({ sub: 'usuario-123', rol: 'SUPERUSUARIO' }, process.env.JWT_SECRET!);
    expect(verificarToken(raro)).toBeNull();
  });

  it('rechaza un token vencido', () => {
    const vencido = jwt.sign({ sub: 'u1', rol: 'ESTUDIANTE' }, process.env.JWT_SECRET!, {
      expiresIn: '-1s',
    });
    expect(verificarToken(vencido)).toBeNull();
  });
});
