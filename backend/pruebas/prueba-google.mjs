// Verifica que entrar con Google no acepte cualquier cosa.
//   node pruebas/prueba-google.mjs [direccion]
//
// No se puede pedirle a Google un token de verdad desde aqui, asi que lo que
// se comprueba es lo que de verdad importa: que la puerta este cerrada para
// todo lo que no venga firmado por Google.
import { createSign, generateKeyPairSync, createPublicKey } from 'node:crypto';

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando la entrada con Google contra ${BASE}\n`);

let ok = 0;
let fallas = 0;

async function probar(nombre, fn) {
  try {
    const r = await fn();
    console.log(`OK    ${nombre}${r ? ` -> ${r}` : ''}`);
    ok++;
  } catch (e) {
    console.log(`FALLA ${nombre} :: ${e.message}`);
    fallas++;
  }
}

async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let datos = null;
  try {
    datos = JSON.parse(texto);
  } catch {
    /* sin cuerpo */
  }
  return { estado: r.status, datos };
}

const exigir = (c, m) => {
  if (!c) throw new Error(m);
};

const base64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Arma un papelito firmado con NUESTRA llave, no con la de Google. */
function papelitoFalso(cuerpo, { alg = 'RS256', kid = 'inventado' } = {}) {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const cabecera = base64url(JSON.stringify({ alg, kid, typ: 'JWT' }));
  const carga = base64url(JSON.stringify(cuerpo));
  const firmador = createSign('RSA-SHA256');
  firmador.update(`${cabecera}.${carga}`);
  return `${cabecera}.${carga}.${base64url(firmador.sign(privateKey))}`;
}

const enUnRato = Math.floor(Date.now() / 1000) + 3600;
const correoInventado = `google-falso-${Math.floor(Math.random() * 999999)}@test.com`;

try {
  await probar('la pagina puede preguntar si el boton esta encendido', async () => {
    const r = await api('/auth/google/estado');
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(typeof r.datos.disponible === 'boolean', 'no dice si esta disponible');
    return r.datos.disponible ? 'encendido' : 'apagado, falta configurar GOOGLE_CLIENT_ID';
  });

  const { datos: estado } = await api('/auth/google/estado');

  if (!estado.disponible) {
    await probar('con el boton apagado, la ruta no acepta nada', async () => {
      const r = await api('/auth/google', { metodo: 'POST', cuerpo: { credencial: 'lo-que-sea' } });
      exigir(r.estado === 400, `estado ${r.estado}`);
      return 'no se puede colar nadie mientras este apagado';
    });
  } else {
    await probar('un papelito firmado por otro NO entra', async () => {
      const falso = papelitoFalso({
        iss: 'https://accounts.google.com',
        aud: estado.clienteId,
        email: correoInventado,
        email_verified: true,
        name: 'Colado',
        exp: enUnRato,
      });
      const r = await api('/auth/google', { metodo: 'POST', cuerpo: { credencial: falso } });
      exigir(r.estado === 401, `estado ${r.estado}`);
      return 'la firma se comprueba contra las llaves de Google';
    });

    await probar('un papelito sin firma tampoco', async () => {
      const cabecera = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
      const carga = base64url(
        JSON.stringify({ iss: 'https://accounts.google.com', aud: estado.clienteId, email: correoInventado, email_verified: true, exp: enUnRato }),
      );
      const r = await api('/auth/google', { metodo: 'POST', cuerpo: { credencial: `${cabecera}.${carga}.` } });
      exigir(r.estado === 401, `estado ${r.estado}`);
      return 'aceptar alg none seria dejar que cualquiera escriba su propio papelito';
    });
  }

  await probar('sin credencial no pasa nada', async () => {
    const r = await api('/auth/google', { metodo: 'POST', cuerpo: {} });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('una credencial que no es ni un papelito se rechaza', async () => {
    const r = await api('/auth/google', { metodo: 'POST', cuerpo: { credencial: 'hola' } });
    exigir(r.estado === 400 || r.estado === 401, `estado ${r.estado}`);
  });

  await probar('no quedo ninguna cuenta creada por los intentos fallidos', async () => {
    const cuantas = await prisma.usuario.count({ where: { email: correoInventado } });
    exigir(cuantas === 0, `se creo ${cuantas} cuenta(s) con un papelito falso`);
    return 'ningun intento fallido dejo cuenta abierta';
  });
} finally {
  await prisma.usuario.deleteMany({ where: { email: correoInventado } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
