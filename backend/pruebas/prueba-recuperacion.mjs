// Verifica recuperar contrasena y confirmar correo, sobre todo la seguridad
// de los enlaces: un solo uso, con vencimiento y sin filtrar quien tiene cuenta.
//   node pruebas/prueba-recuperacion.mjs [direccion]
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = new PrismaClient({ log: ['error'] });

console.log(`Probando recuperacion contra ${BASE}\n`);

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

async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers,
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

const hashear = (t) => createHash('sha256').update(t).digest('hex');

const correo = `recup${Math.floor(Math.random() * 999999)}@test.com`;
const CLAVE_VIEJA = 'claveVieja12345';
const CLAVE_NUEVA = 'claveNueva98765';
let usuarioId = '';

/** Crea un token igual que el servidor, para probar sin depender del correo. */
async function tokenNuevo(tipo, minutos = 60) {
  await prisma.tokenCorreo.deleteMany({ where: { usuarioId, tipo, usadoEn: null } });
  const token = randomBytes(32).toString('base64url');
  await prisma.tokenCorreo.create({
    data: {
      tokenHash: hashear(token),
      tipo,
      usuarioId,
      expiraEn: new Date(Date.now() + minutos * 60 * 1000),
    },
  });
  return token;
}

try {
  const reg = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Recuperacion',
      email: correo,
      password: CLAVE_VIEJA,
      rol: 'ESTUDIANTE',
    },
  });
  usuarioId = reg.datos.usuario.id;

  console.log('--- no se filtra quien tiene cuenta ---');

  await probar('pedir el enlace con un correo que existe', async () => {
    const r = await api('/auth/recuperar', { metodo: 'POST', cuerpo: { email: correo } });
    exigir(r.estado === 200 || r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje.slice(0, 60);
  });

  await probar('pedirlo con un correo que NO existe responde igual', async () => {
    const a = await api('/auth/recuperar', { metodo: 'POST', cuerpo: { email: correo } });
    const b = await api('/auth/recuperar', {
      metodo: 'POST',
      cuerpo: { email: `noexiste${Math.random()}@test.com` },
    });
    exigir(a.estado === b.estado, `estados distintos: ${a.estado} y ${b.estado}`);
    exigir(
      JSON.stringify(a.datos) === JSON.stringify(b.datos),
      'las respuestas son distintas y delatan quien tiene cuenta',
    );
    return 'misma respuesta en ambos casos';
  });

  console.log('\n--- cambiar la contrasena ---');

  await probar('un enlace inventado no sirve', async () => {
    const r = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: 'esto-me-lo-invente', password: CLAVE_NUEVA },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje.slice(0, 50);
  });

  await probar('un enlace vencido no sirve', async () => {
    const token = await tokenNuevo('RECUPERAR_CLAVE', -10);
    const r = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token, password: CLAVE_NUEVA },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('un enlace de confirmar correo no sirve para cambiar la clave', async () => {
    const token = await tokenNuevo('VERIFICAR_CORREO');
    const r = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token, password: CLAVE_NUEVA },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return 'los tipos de enlace no se mezclan';
  });

  await probar('una contrasena corta se rechaza', async () => {
    const token = await tokenNuevo('RECUPERAR_CLAVE');
    const r = await api('/auth/restablecer', { metodo: 'POST', cuerpo: { token, password: 'abc' } });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  let tokenBueno = '';
  await probar('el enlace correcto SI cambia la contrasena', async () => {
    tokenBueno = await tokenNuevo('RECUPERAR_CLAVE');
    const r = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: tokenBueno, password: CLAVE_NUEVA },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('con la contrasena nueva SI entra', async () => {
    const r = await api('/auth/login', {
      metodo: 'POST',
      cuerpo: { email: correo, password: CLAVE_NUEVA },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
  });

  await probar('con la contrasena vieja YA NO entra', async () => {
    const r = await api('/auth/login', {
      metodo: 'POST',
      cuerpo: { email: correo, password: CLAVE_VIEJA },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('el mismo enlace no se puede usar dos veces', async () => {
    const r = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: tokenBueno, password: 'otraClaveMas123' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    const sigue = await api('/auth/login', {
      metodo: 'POST',
      cuerpo: { email: correo, password: CLAVE_NUEVA },
    });
    exigir(sigue.estado === 200, 'la contrasena cambio con un enlace ya usado');
    return 'el segundo intento fue rechazado';
  });

  await probar('pedir un enlace nuevo invalida el anterior', async () => {
    const primero = await tokenNuevo('RECUPERAR_CLAVE');
    const segundo = await tokenNuevo('RECUPERAR_CLAVE');
    const conViejo = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: primero, password: 'noDeberiaPasar123' },
    });
    exigir(conViejo.estado === 400, `el enlace viejo sirvio (estado ${conViejo.estado})`);
    const conNuevo = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: segundo, password: CLAVE_NUEVA },
    });
    exigir(conNuevo.estado === 200, `el enlace nuevo no sirvio (estado ${conNuevo.estado})`);
  });

  await probar('en la base solo queda el hash, nunca el codigo', async () => {
    const token = await tokenNuevo('RECUPERAR_CLAVE');
    const guardados = await prisma.tokenCorreo.findMany({ where: { usuarioId } });
    const filtrado = guardados.some((t) => t.tokenHash === token);
    exigir(!filtrado, 'FUGA: el codigo esta guardado en texto plano');
    const conHash = guardados.some((t) => t.tokenHash === hashear(token));
    exigir(conHash, 'no guardo el hash');
    return 'solo el hash';
  });

  console.log('\n--- confirmar el correo ---');

  await probar('al registrarse el correo empieza sin confirmar', async () => {
    const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    exigir(u.emailVerificadoEn === null, 'quedo confirmado sin haber hecho nada');
  });

  await probar('un enlace inventado no confirma nada', async () => {
    const r = await api('/auth/verificar/confirmar', {
      metodo: 'POST',
      cuerpo: { token: 'inventado' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('el enlace correcto SI confirma el correo', async () => {
    const token = await tokenNuevo('VERIFICAR_CORREO');
    const r = await api('/auth/verificar/confirmar', { metodo: 'POST', cuerpo: { token } });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    exigir(u.emailVerificadoEn !== null, 'no quedo marcado en la base');
    return r.datos.mensaje;
  });

  await probar('el perfil ya reporta el correo como confirmado', async () => {
    const login = await api('/auth/login', {
      metodo: 'POST',
      cuerpo: { email: correo, password: CLAVE_NUEVA },
    });
    exigir(login.datos.usuario.emailVerificado === true, 'sigue diciendo que no');
  });

  await probar('confirmar dos veces con el mismo enlace no sirve', async () => {
    const usados = await prisma.tokenCorreo.findMany({
      where: { usuarioId, tipo: 'VERIFICAR_CORREO', usadoEn: { not: null } },
    });
    exigir(usados.length > 0, 'no quedo marcado como usado');
  });
} finally {
  await prisma.usuario.deleteMany({ where: { email: correo } });
  await prisma.$disconnect();
  console.log('\nCuenta temporal eliminada.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
