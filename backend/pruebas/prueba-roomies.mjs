// Verifica el buscador de roomies.
//   node pruebas/prueba-roomies.mjs [direccion]

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando roomies contra ${BASE}\n`);

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

const suf = Math.floor(Math.random() * 999999);
const correos = {
  ana: `room-ana${suf}@test.com`,
  luis: `room-luis${suf}@test.com`,
  sinTel: `room-sintel${suf}@test.com`,
};

let tAna = '';
let tLuis = '';
let tSinTel = '';
let idPerfilAna = '';
let idPerfilSinTel = '';

const PERFIL_BASE = {
  presupuestoMax: 350000,
  descripcion:
    'Estudio ingeniería de sistemas, soy tranquila y ordenada. Busco compartir un apartamento cerca de la universidad.',
  zonaPreferida: 'El Buque',
  carrera: 'Ingeniería de sistemas',
  semestre: 5,
  ritmo: 'MADRUGADOR',
  conQuien: 'CUALQUIERA',
  fuma: false,
  tieneMascota: false,
  aceptaMascotas: true,
  activo: true,
};

async function crear(correo, telefono) {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Roomie',
      email: correo,
      password: 'clave12345',
      rol: 'ESTUDIANTE',
      ...(telefono ? { telefono } : {}),
    },
  });
  return r.datos.token;
}

try {
  tAna = await crear(correos.ana, '3145550001');
  tLuis = await crear(correos.luis, '3145550002');
  tSinTel = await crear(correos.sinTel);

  console.log('--- crear el perfil ---');

  await probar('sin sesión no se puede crear perfil', async () => {
    const r = await api('/roomies/mio', { metodo: 'PUT', cuerpo: PERFIL_BASE });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('una descripción muy corta se rechaza', async () => {
    const r = await api('/roomies/mio', {
      metodo: 'PUT',
      token: tAna,
      cuerpo: { ...PERFIL_BASE, descripcion: 'Hola' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje.slice(0, 55);
  });

  await probar('un presupuesto absurdo se rechaza', async () => {
    const r = await api('/roomies/mio', {
      metodo: 'PUT',
      token: tAna,
      cuerpo: { ...PERFIL_BASE, presupuestoMax: 100 },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('Ana crea su perfil', async () => {
    const r = await api('/roomies/mio', { metodo: 'PUT', token: tAna, cuerpo: PERFIL_BASE });
    exigir(r.estado === 200, `estado ${r.estado}`);
    idPerfilAna = r.datos.perfil.id;
  });

  await probar('guardar dos veces actualiza, no duplica', async () => {
    await api('/roomies/mio', {
      metodo: 'PUT',
      token: tAna,
      cuerpo: { ...PERFIL_BASE, presupuestoMax: 400000 },
    });
    const cuantos = await prisma.perfilRoomie.count({
      where: { usuario: { email: correos.ana } },
    });
    exigir(cuantos === 1, `hay ${cuantos} perfiles de la misma persona`);
    const r = await api('/roomies/mio', { token: tAna });
    exigir(r.datos.perfil.presupuestoMax === 400000, 'no guardó el cambio');
    return 'un solo perfil, actualizado';
  });

  console.log('\n--- lo que se ve y lo que no ---');

  await probar('el listado NO muestra el celular de nadie', async () => {
    const r = await api('/roomies');
    exigir(r.estado === 200, `estado ${r.estado}`);
    const json = JSON.stringify(r.datos);
    exigir(!json.includes('3145550001'), 'FUGA: el celular aparece en el listado');
    return 'celular oculto';
  });

  await probar('el listado NO muestra el correo de nadie', async () => {
    const r = await api('/roomies');
    exigir(!JSON.stringify(r.datos).includes(correos.ana), 'FUGA: el correo aparece');
  });

  await probar('solo se muestra el nombre de pila', async () => {
    const r = await api('/roomies');
    const mio = r.datos.perfiles.find((p) => p.id === idPerfilAna);
    exigir(mio.nombre === 'Prueba', `muestra "${mio.nombre}"`);
  });

  console.log('\n--- filtros ---');

  await probar('filtro por presupuesto máximo', async () => {
    const r = await api('/roomies?presupuestoMax=300000');
    const caros = r.datos.perfiles.filter((p) => p.presupuestoMax > 300000);
    exigir(caros.length === 0, `devolvió ${caros.length} por encima del tope`);
    return `${r.datos.total} resultados`;
  });

  await probar('filtro por zona', async () => {
    const r = await api('/roomies?zona=Buque');
    const otros = r.datos.perfiles.filter(
      (p) => p.zonaPreferida && !p.zonaPreferida.toLowerCase().includes('buque'),
    );
    exigir(otros.length === 0, 'devolvió otras zonas');
  });

  await probar('filtro de solo no fumadores', async () => {
    const r = await api('/roomies?sinFumadores=true');
    const fumadores = r.datos.perfiles.filter((p) => p.fuma);
    exigir(fumadores.length === 0, 'devolvió fumadores');
  });

  await probar('un perfil desactivado desaparece del listado', async () => {
    await api('/roomies/mio', {
      metodo: 'PUT',
      token: tAna,
      cuerpo: { ...PERFIL_BASE, activo: false },
    });
    const r = await api('/roomies');
    const sigue = r.datos.perfiles.some((p) => p.id === idPerfilAna);
    exigir(!sigue, 'sigue apareciendo');
    await api('/roomies/mio', { metodo: 'PUT', token: tAna, cuerpo: PERFIL_BASE });
  });

  console.log('\n--- contactar ---');

  await probar('sin sesión no se puede pedir el celular', async () => {
    const r = await api(`/roomies/${idPerfilAna}/contacto`, { metodo: 'POST' });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('Luis pide el celular de Ana y le sale el enlace', async () => {
    const r = await api(`/roomies/${idPerfilAna}/contacto`, { metodo: 'POST', token: tLuis });
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.telefono === '3145550001', 'celular incorrecto');
    exigir(r.datos.enlaceWhatsapp.startsWith('https://wa.me/573145550001'), 'enlace mal armado');
    return r.datos.enlaceWhatsapp.slice(0, 42) + '...';
  });

  await probar('queda constancia de quién pidió el celular', async () => {
    const cuantos = await prisma.contactoRoomie.count({ where: { perfilId: idPerfilAna } });
    exigir(cuantos === 1, `hay ${cuantos} registros`);
  });

  await probar('pedirlo dos veces no duplica el registro', async () => {
    await api(`/roomies/${idPerfilAna}/contacto`, { metodo: 'POST', token: tLuis });
    const cuantos = await prisma.contactoRoomie.count({ where: { perfilId: idPerfilAna } });
    exigir(cuantos === 1, `quedaron ${cuantos}`);
  });

  await probar('nadie puede contactarse a sí mismo', async () => {
    const r = await api(`/roomies/${idPerfilAna}/contacto`, { metodo: 'POST', token: tAna });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('avisa si la persona no registró celular', async () => {
    const creado = await api('/roomies/mio', {
      metodo: 'PUT',
      token: tSinTel,
      cuerpo: PERFIL_BASE,
    });
    idPerfilSinTel = creado.datos.perfil.id;
    const r = await api(`/roomies/${idPerfilSinTel}/contacto`, { metodo: 'POST', token: tLuis });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje.slice(0, 50);
  });

  await probar('borrar el perfil lo saca del listado', async () => {
    const r = await api('/roomies/mio', { metodo: 'DELETE', token: tSinTel });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const listado = await api('/roomies');
    exigir(!listado.datos.perfiles.some((p) => p.id === idPerfilSinTel), 'sigue ahí');
  });
} finally {
  await prisma.usuario.deleteMany({ where: { email: { in: Object.values(correos) } } });
  await prisma.$disconnect();
  console.log('\nCuentas temporales eliminadas.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
