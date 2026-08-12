import { createPublicKey, createVerify } from 'node:crypto';
import { env } from './env.js';

/*
  Entrar con la cuenta de Google.

  El navegador le pide a Google que identifique a la persona y recibe un
  "credential", que es un papelito firmado por Google diciendo quien es. Aqui
  se comprueba esa firma contra las llaves publicas de Google, y solo entonces
  se cree lo que dice.

  Se comprueba aqui y no se le pregunta a Google por cada entrada porque asi
  no se depende de que Google responda en ese momento, y porque preguntar
  manda el token de la persona a un tercero en cada inicio de sesion.

  No hace falta ningun secreto: solo el identificador de cliente, que es
  publico y va tambien en la pagina.
*/

export const googleConfigurado = env.GOOGLE_CLIENT_ID !== '';

const LLAVES = 'https://www.googleapis.com/oauth2/v3/certs';
const EMISORES = ['https://accounts.google.com', 'accounts.google.com'];

interface LlavePublica {
  kid: string;
  n: string;
  e: string;
  alg?: string;
}

/**
 * Las llaves de Google se guardan un rato. Cambian cada pocos dias, y pedirlas
 * en cada inicio de sesion seria una espera de mas para nada.
 */
let cache: { llaves: LlavePublica[]; hasta: number } | null = null;

async function llavesDeGoogle(): Promise<LlavePublica[]> {
  if (cache !== null && cache.hasta > Date.now()) return cache.llaves;

  const r = await fetch(LLAVES);
  if (!r.ok) throw new Error(`Google respondio ${r.status} al pedir sus llaves`);
  const datos = (await r.json()) as { keys: LlavePublica[] };

  // Se respeta cuanto dice Google que duran, con un tope de una hora.
  const control = r.headers.get('cache-control') ?? '';
  const segundos = Number(/max-age=(\d+)/.exec(control)?.[1] ?? 3600);
  cache = { llaves: datos.keys, hasta: Date.now() + Math.min(segundos, 3600) * 1000 };
  return datos.keys;
}

const desdeBase64Url = (texto: string): Buffer =>
  Buffer.from(texto.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export interface PersonaDeGoogle {
  email: string;
  nombre: string;
  correoVerificado: boolean;
}

/**
 * Revisa el papelito de Google y devuelve quien es, o null si no cuadra.
 *
 * Se revisa todo: la firma, quien lo emitio, para quien es y que no este
 * vencido. Saltarse cualquiera de esas deja entrar con un token de otra
 * aplicacion o con uno viejo.
 */
export async function personaDeGoogle(credencial: string): Promise<PersonaDeGoogle | null> {
  if (!googleConfigurado) return null;

  const partes = credencial.split('.');
  if (partes.length !== 3) return null;

  let cabecera: { kid?: string; alg?: string };
  let cuerpo: Record<string, unknown>;
  try {
    cabecera = JSON.parse(desdeBase64Url(partes[0]).toString('utf8'));
    cuerpo = JSON.parse(desdeBase64Url(partes[1]).toString('utf8'));
  } catch {
    return null;
  }

  // Solo RS256, que es lo que firma Google. Aceptar otra cosa, y sobre todo
  // "none", seria dejar que cualquiera escriba su propio papelito.
  if (cabecera.alg !== 'RS256' || typeof cabecera.kid !== 'string') return null;

  const llave = (await llavesDeGoogle()).find((k) => k.kid === cabecera.kid);
  if (!llave) return null;

  const publica = createPublicKey({
    key: { kty: 'RSA', n: llave.n, e: llave.e },
    format: 'jwk',
  });

  const verificador = createVerify('RSA-SHA256');
  verificador.update(`${partes[0]}.${partes[1]}`);
  if (!verificador.verify(publica, desdeBase64Url(partes[2]))) return null;

  if (typeof cuerpo.iss !== 'string' || !EMISORES.includes(cuerpo.iss)) return null;
  if (cuerpo.aud !== env.GOOGLE_CLIENT_ID) return null;

  const ahora = Math.floor(Date.now() / 1000);
  // Un minuto de margen, por si los relojes no coinciden exactamente.
  if (typeof cuerpo.exp !== 'number' || cuerpo.exp + 60 < ahora) return null;

  const email = typeof cuerpo.email === 'string' ? cuerpo.email.trim().toLowerCase() : '';
  if (email === '') return null;

  // Si Google mismo no da por confirmado el correo, no se acepta: sin eso,
  // alguien podria reclamar el correo de otra persona.
  if (cuerpo.email_verified !== true && cuerpo.email_verified !== 'true') return null;

  const nombre =
    typeof cuerpo.name === 'string' && cuerpo.name.trim() !== ''
      ? cuerpo.name.trim()
      : email.split('@')[0];

  return { email, nombre, correoVerificado: true };
}
