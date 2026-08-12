import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSign, generateKeyPairSync } from 'node:crypto';

/*
  Se prueba la comprobacion de la firma con una llave nuestra, haciendo de
  cuenta que es la de Google. Es la parte que de verdad importa: si esto se
  afloja, cualquiera puede escribir un papelito diciendo que es el correo de
  otra persona y entrar a su cuenta.
*/

const CLIENTE = 'prueba-de-cliente.apps.googleusercontent.com';

const base64url = (v: Buffer | string): string =>
  Buffer.from(v).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const otroPar = generateKeyPairSync('rsa', { modulusLength: 2048 });

const jwk = publicKey.export({ format: 'jwk' }) as { n: string; e: string };

const firmar = (
  cuerpo: Record<string, unknown>,
  { alg = 'RS256', kid = 'llave-1', llave = privateKey } = {},
): string => {
  const cabecera = base64url(JSON.stringify({ alg, kid, typ: 'JWT' }));
  const carga = base64url(JSON.stringify(cuerpo));
  const f = createSign('RSA-SHA256');
  f.update(`${cabecera}.${carga}`);
  return `${cabecera}.${carga}.${base64url(f.sign(llave))}`;
};

const enUnaHora = () => Math.floor(Date.now() / 1000) + 3600;

const bueno = (extra: Record<string, unknown> = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENTE,
  email: 'ana@gmail.com',
  email_verified: true,
  name: 'Ana Maria Perez',
  exp: enUnaHora(),
  ...extra,
});

/** Se carga el modulo con la variable puesta y con el fetch imitado. */
async function cargar() {
  vi.resetModules();
  vi.stubEnv('GOOGLE_CLIENT_ID', CLIENTE);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ keys: [{ kid: 'llave-1', kty: 'RSA', alg: 'RS256', ...jwk }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  return import('./google.js');
}

describe('personaDeGoogle', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('acepta un papelito bien firmado por Google', async () => {
    const { personaDeGoogle } = await cargar();
    const r = await personaDeGoogle(firmar(bueno()));
    expect(r).toEqual({ email: 'ana@gmail.com', nombre: 'Ana Maria Perez', correoVerificado: true });
  });

  it('rechaza uno firmado con otra llave', async () => {
    const { personaDeGoogle } = await cargar();
    const r = await personaDeGoogle(firmar(bueno(), { llave: otroPar.privateKey }));
    expect(r).toBeNull();
  });

  it('rechaza uno sin firma, con alg none', async () => {
    const { personaDeGoogle } = await cargar();
    const cabecera = base64url(JSON.stringify({ alg: 'none', kid: 'llave-1', typ: 'JWT' }));
    const carga = base64url(JSON.stringify(bueno()));
    expect(await personaDeGoogle(`${cabecera}.${carga}.`)).toBeNull();
  });

  it('rechaza uno hecho para otra aplicacion', async () => {
    const { personaDeGoogle } = await cargar();
    // Un token valido de OTRA pagina que tambien usa Google. Sin esta
    // comprobacion, cualquiera de esas paginas podria entrar aqui.
    const r = await personaDeGoogle(firmar(bueno({ aud: 'otra-app.apps.googleusercontent.com' })));
    expect(r).toBeNull();
  });

  it('rechaza uno que no viene de Google', async () => {
    const { personaDeGoogle } = await cargar();
    expect(await personaDeGoogle(firmar(bueno({ iss: 'https://no-es-google.com' })))).toBeNull();
  });

  it('rechaza uno vencido', async () => {
    const { personaDeGoogle } = await cargar();
    expect(await personaDeGoogle(firmar(bueno({ exp: Math.floor(Date.now() / 1000) - 120 })))).toBeNull();
  });

  it('perdona un minuto de diferencia en el reloj', async () => {
    const { personaDeGoogle } = await cargar();
    const r = await personaDeGoogle(firmar(bueno({ exp: Math.floor(Date.now() / 1000) - 30 })));
    expect(r).not.toBeNull();
  });

  it('rechaza uno cuyo correo Google no da por confirmado', async () => {
    const { personaDeGoogle } = await cargar();
    // Si no, alguien podria reclamar el correo de otra persona.
    expect(await personaDeGoogle(firmar(bueno({ email_verified: false })))).toBeNull();
  });

  it('rechaza uno firmado con una llave que Google no publica', async () => {
    const { personaDeGoogle } = await cargar();
    expect(await personaDeGoogle(firmar(bueno(), { kid: 'llave-que-no-existe' }))).toBeNull();
  });

  it('rechaza cualquier cosa que no sea un papelito', async () => {
    const { personaDeGoogle } = await cargar();
    expect(await personaDeGoogle('hola')).toBeNull();
    expect(await personaDeGoogle('')).toBeNull();
    expect(await personaDeGoogle('a.b.c')).toBeNull();
  });

  it('si falta el nombre, usa la parte de antes del arroba', async () => {
    const { personaDeGoogle } = await cargar();
    const r = await personaDeGoogle(firmar(bueno({ name: undefined, email: 'kevin.duarte@gmail.com' })));
    expect(r?.nombre).toBe('kevin.duarte');
  });

  it('deja el correo en minusculas y sin espacios', async () => {
    const { personaDeGoogle } = await cargar();
    const r = await personaDeGoogle(firmar(bueno({ email: '  ANA@Gmail.COM  ' })));
    expect(r?.email).toBe('ana@gmail.com');
  });

  it('con el boton apagado no acepta ni uno bueno', async () => {
    vi.resetModules();
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    const { personaDeGoogle, googleConfigurado } = await import('./google.js');
    expect(googleConfigurado).toBe(false);
    expect(await personaDeGoogle(firmar(bueno()))).toBeNull();
  });
});
