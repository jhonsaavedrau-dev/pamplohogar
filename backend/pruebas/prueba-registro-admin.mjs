// Verifica que quede constancia de lo que hace cada administrador.
//   node pruebas/prueba-registro-admin.mjs [direccion]

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando el registro de administradores contra ${BASE}\n`);

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

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const suf = Math.floor(Math.random() * 999999);
const correos = {
  admin: `reg-admin${suf}@test.com`,
  arrendador: `reg-arr${suf}@test.com`,
  victima: `reg-vic${suf}@test.com`,
};

let tAdmin = '';
let tArr = '';
let idAdmin = '';
let idVictima = '';
let idInmueble = '';

async function crear(correo, rol, telefono) {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Registro',
      email: correo,
      password: 'clave12345',
      rol,
      ...(telefono ? { telefono } : {}),
    },
  });
  return r.datos;
}

/** El registro se anota sin bloquear la respuesta, asi que hay que darle un instante. */
async function contarAcciones(accion) {
  await esperar(700);
  return prisma.registroAdmin.count({ where: { adminId: idAdmin, accion } });
}

try {
  const admin = await crear(correos.admin, 'ESTUDIANTE');
  tAdmin = admin.token;
  idAdmin = admin.usuario.id;
  await prisma.usuario.update({ where: { id: idAdmin }, data: { rol: 'ADMIN' } });

  const arr = await crear(correos.arrendador, 'ARRENDADOR', '3001234567');
  tArr = arr.token;

  const victima = await crear(correos.victima, 'ESTUDIANTE');
  idVictima = victima.usuario.id;

  const nuevo = await api('/inmuebles', {
    metodo: 'POST',
    token: tArr,
    cuerpo: {
      titulo: 'Inmueble para probar el registro de acciones',
      descripcion: 'Descripcion suficientemente larga para pasar la validacion del servidor.',
      tipo: 'HABITACION',
      precio: 400000,
      barrio: 'Centro',
      direccion: 'Calle 1 # 2-3',
      lat: 7.3768,
      lng: -72.6474,
      habitaciones: 1,
      banos: 1,
      servicios: [],
      amoblado: false,
      fotos: [],
    },
  });
  idInmueble = nuevo.datos.inmueble.id;

  await probar('un administrador nuevo empieza sin nada anotado', async () => {
    const n = await prisma.registroAdmin.count({ where: { adminId: idAdmin } });
    exigir(n === 0, `ya tenia ${n} anotaciones`);
  });

  await probar('retirar un inmueble ajeno queda anotado', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tAdmin,
      cuerpo: { activo: false },
    });
    const n = await contarAcciones('OCULTO_INMUEBLE');
    exigir(n === 1, `se anotaron ${n}`);
  });

  await probar('volver a publicarlo tambien queda anotado', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tAdmin,
      cuerpo: { activo: true },
    });
    const n = await contarAcciones('MOSTRO_INMUEBLE');
    exigir(n === 1, `se anotaron ${n}`);
  });

  await probar('cambiar el rol de alguien queda anotado con el detalle', async () => {
    await api(`/admin/usuarios/${idVictima}/rol`, {
      metodo: 'PATCH',
      token: tAdmin,
      cuerpo: { rol: 'ARRENDADOR' },
    });
    await esperar(700);
    const r = await prisma.registroAdmin.findFirst({
      where: { adminId: idAdmin, accion: 'CAMBIO_ROL' },
    });
    exigir(r !== null, 'no se anoto');
    exigir(r.descripcion.includes('ESTUDIANTE') && r.descripcion.includes('ARRENDADOR'),
      `la descripcion no dice el cambio: ${r.descripcion}`);
    return r.descripcion.slice(0, 60);
  });

  await probar('el arrendador editando lo suyo NO ensucia el registro', async () => {
    const antes = await prisma.registroAdmin.count({ where: { adminId: idAdmin } });
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { activo: false },
    });
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { activo: true },
    });
    await esperar(700);
    const despues = await prisma.registroAdmin.count({ where: { adminId: idAdmin } });
    exigir(antes === despues, 'se anotaron acciones del dueno como si fueran de moderacion');
    return 'solo se anota la moderacion';
  });

  await probar('eliminar un inmueble ajeno queda anotado con su titulo', async () => {
    await api(`/inmuebles/${idInmueble}`, { metodo: 'DELETE', token: tAdmin });
    await esperar(700);
    const r = await prisma.registroAdmin.findFirst({
      where: { adminId: idAdmin, accion: 'ELIMINO_INMUEBLE' },
    });
    exigir(r !== null, 'no se anoto');
    exigir(r.descripcion.includes('registro de acciones'), 'no guardo el titulo');
    return 'el titulo sobrevive al borrado';
  });

  await probar('eliminar una cuenta queda anotado con su correo', async () => {
    await api(`/admin/usuarios/${idVictima}`, { metodo: 'DELETE', token: tAdmin });
    await esperar(700);
    const r = await prisma.registroAdmin.findFirst({
      where: { adminId: idAdmin, accion: 'ELIMINO_USUARIO' },
    });
    exigir(r !== null, 'no se anoto');
    exigir(r.descripcion.includes(correos.victima), 'no guardo el correo');
    return 'el correo sobrevive al borrado';
  });

  await probar('el panel muestra el registro completo', async () => {
    const r = await api('/admin/registro', { token: tAdmin });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const mios = r.datos.registros.filter((x) => x.adminEmail === correos.admin);
    exigir(mios.length === 5, `esperaba 5 acciones y hay ${mios.length}`);
    exigir(mios[0].admin !== undefined, 'no dice quien fue');
    return `${mios.length} acciones anotadas`;
  });

  await probar('viene lo mas reciente primero', async () => {
    const r = await api('/admin/registro', { token: tAdmin });
    const mios = r.datos.registros.filter((x) => x.adminEmail === correos.admin);
    const fechas = mios.map((x) => new Date(x.creadoEn).getTime());
    const ordenado = [...fechas].sort((a, b) => b - a);
    exigir(JSON.stringify(fechas) === JSON.stringify(ordenado), 'no vienen ordenadas');
  });

  await probar('un estudiante no puede ver el registro', async () => {
    const otro = await crear(`reg-miron${suf}@test.com`, 'ESTUDIANTE');
    const r = await api('/admin/registro', { token: otro.token });
    exigir(r.estado === 403, `estado ${r.estado}`);
    await prisma.usuario.deleteMany({ where: { email: `reg-miron${suf}@test.com` } });
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
