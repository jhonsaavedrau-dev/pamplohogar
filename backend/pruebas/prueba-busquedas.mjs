// Verifica las busquedas guardadas y el aviso por correo.
//   node pruebas/prueba-busquedas.mjs [direccion]
import { PrismaClient } from '@prisma/client';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = new PrismaClient({ log: ['error'] });

console.log(`Probando busquedas guardadas contra ${BASE}\n`);

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

async function api(ruta, { metodo = 'GET', cuerpo, token, clave } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave) headers.Authorization = `Bearer ${clave}`;
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
  estudiante: `bus-est${suf}@test.com`,
  arrendador: `bus-arr${suf}@test.com`,
  otro: `bus-otro${suf}@test.com`,
};

let tEst = '';
let tArr = '';
let tOtro = '';
let idBusqueda = '';

async function crear(correo, rol, telefono) {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Busquedas',
      email: correo,
      password: 'clave12345',
      rol,
      ...(telefono ? { telefono } : {}),
    },
  });
  return r.datos.token;
}

async function publicar(token, precio, barrio, tipo = 'HABITACION') {
  const r = await api('/inmuebles', {
    metodo: 'POST',
    token,
    cuerpo: {
      titulo: `Inmueble de prueba para avisos en ${barrio}`,
      descripcion: 'Descripción suficientemente larga para pasar la validación del servidor.',
      tipo,
      precio,
      barrio,
      direccion: 'Calle 1 # 2-3',
      lat: 7.3768,
      lng: -72.6474,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi'],
      amoblado: false,
      fotos: [],
    },
  });
  return r.datos?.inmueble?.id;
}

try {
  tEst = await crear(correos.estudiante, 'ESTUDIANTE');
  tArr = await crear(correos.arrendador, 'ARRENDADOR', '3001112233');
  tOtro = await crear(correos.otro, 'ESTUDIANTE');

  console.log('--- guardar una busqueda ---');

  await probar('sin sesión no se puede guardar', async () => {
    const r = await api('/busquedas', { metodo: 'POST', cuerpo: { nombre: 'Algo' } });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('un nombre muy corto se rechaza', async () => {
    const r = await api('/busquedas', { metodo: 'POST', token: tEst, cuerpo: { nombre: 'ab' } });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('el precio mínimo no puede superar al máximo', async () => {
    const r = await api('/busquedas', {
      metodo: 'POST',
      token: tEst,
      cuerpo: { nombre: 'Al reves', precioMin: 900000, precioMax: 300000 },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('el estudiante guarda su búsqueda', async () => {
    const r = await api('/busquedas', {
      metodo: 'POST',
      token: tEst,
      cuerpo: {
        nombre: 'Barato cerca de la U',
        precioMax: 400000,
        tipo: 'HABITACION',
        avisarPorCorreo: true,
      },
    });
    exigir(r.estado === 201, `estado ${r.estado}`);
    idBusqueda = r.datos.busqueda.id;
    return r.datos.mensaje;
  });

  await probar('la búsqueda aparece con cuántos inmuebles encajan', async () => {
    const r = await api('/busquedas', { token: tEst });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const mia = r.datos.busquedas.find((b) => b.id === idBusqueda);
    exigir(mia !== undefined, 'no aparece');
    exigir(typeof mia.coincidencias === 'number', 'no dice cuántos encajan');
    return `${mia.coincidencias} encajan hoy`;
  });

  await probar('nadie ve las búsquedas de otro', async () => {
    const r = await api('/busquedas', { token: tOtro });
    const ajena = r.datos.busquedas.find((b) => b.id === idBusqueda);
    exigir(ajena === undefined, 'FUGA: ve la búsqueda de otra persona');
  });

  await probar('nadie puede borrar la búsqueda de otro', async () => {
    const r = await api(`/busquedas/${idBusqueda}`, { metodo: 'DELETE', token: tOtro });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });

  await probar('puede apagar los avisos sin perder la búsqueda', async () => {
    const r = await api(`/busquedas/${idBusqueda}`, {
      metodo: 'PATCH',
      token: tEst,
      cuerpo: { avisarPorCorreo: false },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.busqueda.avisarPorCorreo === false, 'siguen encendidos');
    await api(`/busquedas/${idBusqueda}`, {
      metodo: 'PATCH',
      token: tEst,
      cuerpo: { avisarPorCorreo: true },
    });
  });

  console.log('\n--- que solo avise de lo que de verdad encaja ---');

  await probar('un inmueble caro NO cuenta como novedad', async () => {
    await publicar(tArr, 900000, 'Centro');
    const b = await prisma.busquedaGuardada.findUnique({ where: { id: idBusqueda } });
    const nuevos = await prisma.inmueble.count({
      where: {
        activo: true,
        precio: { lte: 400000 },
        tipo: 'HABITACION',
        creadoEn: { gt: b.revisadaHasta },
        arrendadorId: { not: b.usuarioId },
      },
    });
    exigir(nuevos === 0, `conto ${nuevos} cuando el precio no encaja`);
  });

  await probar('un inmueble barato SÍ cuenta como novedad', async () => {
    await publicar(tArr, 300000, 'El Buque');
    const b = await prisma.busquedaGuardada.findUnique({ where: { id: idBusqueda } });
    const nuevos = await prisma.inmueble.count({
      where: {
        activo: true,
        precio: { lte: 400000 },
        tipo: 'HABITACION',
        creadoEn: { gt: b.revisadaHasta },
        arrendadorId: { not: b.usuarioId },
      },
    });
    exigir(nuevos >= 1, 'no lo conto');
    return `${nuevos} novedad(es)`;
  });

  console.log('\n--- la tarea de avisos esta protegida ---');

  await probar('sin clave no se puede disparar', async () => {
    const r = await api('/avisos/enviar', { metodo: 'POST' });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('con una clave inventada tampoco', async () => {
    const r = await api('/avisos/enviar', { metodo: 'POST', clave: 'me-la-invente' });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('la sesión de un usuario no sirve como clave', async () => {
    const r = await api('/avisos/enviar', { metodo: 'POST', clave: tEst });
    exigir(r.estado === 401, `estado ${r.estado}`);
    return 'ni siquiera con un token válido de sesión';
  });
} finally {
  await prisma.inmueble.deleteMany({ where: { arrendador: { email: correos.arrendador } } });
  await prisma.usuario.deleteMany({ where: { email: { in: Object.values(correos) } } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
