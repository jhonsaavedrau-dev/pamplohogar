// Comprueba que un cambio de rol tiene efecto de inmediato, sin volver a entrar,
// y que quitarle el rol a alguien le corta los permisos al instante.
//   node pruebas/prueba-roles-en-vivo.mjs [direccion]

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

let ok = 0;
let fallas = 0;

function revisar(nombre, condicion, detalle = '') {
  if (condicion) {
    console.log(`OK    ${nombre}${detalle ? ` -> ${detalle}` : ''}`);
    ok++;
  } else {
    console.log(`FALLA ${nombre}${detalle ? ` :: ${detalle}` : ''}`);
    fallas++;
  }
}

const correo = `roles${Math.floor(Math.random() * 999999)}@test.com`;

async function estado(ruta, token) {
  const r = await fetch(`${BASE}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.status;
}

try {
  const reg = await fetch(`${BASE}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Prueba De Roles',
      email: correo,
      password: 'clave12345',
      rol: 'ESTUDIANTE',
    }),
  });
  const { token, usuario } = await reg.json();

  revisar('un estudiante recien creado no entra al panel', (await estado('/admin/resumen', token)) === 403);

  await prisma.usuario.update({ where: { id: usuario.id }, data: { rol: 'ADMIN' } });

  revisar(
    'al ascenderlo entra de inmediato, SIN volver a iniciar sesion',
    (await estado('/admin/resumen', token)) === 200,
    'con el mismo token de antes',
  );

  await prisma.usuario.update({ where: { id: usuario.id }, data: { rol: 'ESTUDIANTE' } });

  revisar(
    'al quitarle el rol pierde el acceso al instante',
    (await estado('/admin/resumen', token)) === 403,
    'la sesion vieja ya no sirve',
  );

  await prisma.usuario.update({ where: { id: usuario.id }, data: { rol: 'ARRENDADOR' } });
  revisar(
    'al volverlo arrendador ya puede publicar sin reiniciar sesion',
    (await estado('/inmuebles/mios', token)) === 200,
  );

  await prisma.usuario.delete({ where: { id: usuario.id } });

  revisar(
    'si borran la cuenta, su sesion deja de servir de una vez',
    (await estado('/favoritos', token)) === 401,
  );
} finally {
  await prisma.usuario.deleteMany({ where: { email: correo } });
  await prisma.$disconnect();
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
