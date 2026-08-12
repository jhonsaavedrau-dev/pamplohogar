// Verifica las opiniones sobre los barrios.
//   node pruebas/prueba-resenas-barrio.mjs [direccion]

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando opiniones de barrio contra ${BASE}\n`);

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
const BARRIO = `Barrio Prueba ${suf}`;
const correos = {
  uno: `bar-est1-${suf}@test.com`,
  dos: `bar-est2-${suf}@test.com`,
  tres: `bar-est3-${suf}@test.com`,
  arrendador: `bar-arr-${suf}@test.com`,
};

const registrar = async (email, rol) => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Ana Maria Perez',
      email,
      password: 'clave12345',
      rol,
      ...(rol === 'ARRENDADOR' ? { telefono: '3001112233' } : {}),
    },
  });
  exigir(r.datos?.token, `no se pudo registrar ${email}: estado ${r.estado}`);
  return r.datos.token;
};

const opinion = (t, s, tr, texto) => ({
  barrio: BARRIO,
  tranquilidad: t,
  seguridad: s,
  transporte: tr,
  comentario: texto,
});

let t1 = '';
let t2 = '';
let t3 = '';
let tArr = '';
let idPrimera = '';

try {
  t1 = await registrar(correos.uno, 'ESTUDIANTE');
  t2 = await registrar(correos.dos, 'ESTUDIANTE');
  t3 = await registrar(correos.tres, 'ESTUDIANTE');
  tArr = await registrar(correos.arrendador, 'ARRENDADOR');

  await probar('sin sesión no se puede opinar', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      cuerpo: opinion(4, 4, 4, 'Intento sin haber iniciado sesion en la plataforma.'),
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('un arrendador no puede calificar el barrio donde arrienda', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: tArr,
      cuerpo: opinion(5, 5, 5, 'Mi barrio es el mejor de toda la ciudad, sin duda alguna.'),
    });
    exigir(r.estado === 403, `estado ${r.estado}`);
    return 'tendria un interes evidente en inflarlo';
  });

  await probar('un estudiante publica su opinión', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: t1,
      cuerpo: opinion(4, 3, 5, 'Se duerme bien y pasa buseta cada rato, pero de noche hay poca luz.'),
    });
    exigir(r.estado === 201, `estado ${r.estado}`);
    idPrimera = r.datos.resena.id;
    return `${r.datos.resena.tranquilidad}/${r.datos.resena.seguridad}/${r.datos.resena.transporte}`;
  });

  await probar('solo se publica el nombre de pila', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(r.datos.resenas[0].autor === 'Ana', `salio "${r.datos.resenas[0].autor}"`);
    return 'el apellido no ayuda a decidir y expone de mas';
  });

  await probar('el correo no se filtra en la respuesta', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    const texto = JSON.stringify(r.datos);
    exigir(!texto.includes(correos.uno), 'aparece el correo de quien opino');
  });

  await probar('con una sola opinión todavía no hay promedio', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(r.datos.promedios === null, 'mostro promedio con una sola opinion');
    exigir(r.datos.total === 1, `total ${r.datos.total}`);
    return 'una persona enojada no define un barrio';
  });

  await probar('opinar otra vez reemplaza, no duplica', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: t1,
      cuerpo: opinion(2, 2, 5, 'Me cambio de opinion: el ruido de la avenida no deja estudiar.'),
    });
    exigir(r.estado === 201, `estado ${r.estado}`);
    const lista = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(lista.datos.total === 1, `quedaron ${lista.datos.total} opiniones`);
    exigir(lista.datos.resenas[0].tranquilidad === 2, 'no se actualizo la calificacion');
  });

  await probar('con tres opiniones ya se muestra el promedio', async () => {
    await api('/barrios/resenas', {
      metodo: 'POST',
      token: t2,
      cuerpo: opinion(4, 4, 4, 'A mi me parecio tranquilo, nunca tuve ningun problema viviendo ahi.'),
    });
    await api('/barrios/resenas', {
      metodo: 'POST',
      token: t3,
      cuerpo: opinion(3, 3, 3, 'Ni bueno ni malo, es un barrio bastante normal para estudiar.'),
    });
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(r.datos.promedios !== null, 'sigue sin mostrar promedio');
    exigir(r.datos.promedios.tranquilidad === 3, `tranquilidad ${r.datos.promedios.tranquilidad}`);
    exigir(r.datos.promedios.transporte === 4, `transporte ${r.datos.promedios.transporte}`);
    return `tranquilidad 3, seguridad 3, transporte 4 sobre ${r.datos.total}`;
  });

  await probar('el mismo barrio escrito distinto cuenta igual', async () => {
    const variante = BARRIO.toUpperCase().replace('BARRIO', ' bÁrrio ');
    const r = await api(`/barrios/resenas/${encodeURIComponent(variante)}`);
    exigir(r.datos.total === 3, `con "${variante}" salieron ${r.datos.total}`);
    return 'mayusculas, acentos y espacios de mas no parten el barrio en dos';
  });

  await probar('quien no ha opinado ve yaOpine en falso', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`, { token: tArr });
    exigir(r.datos.yaOpine === false, 'dice que ya opino');
  });

  await probar('quien ya opinó lo ve marcado', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`, { token: t1 });
    exigir(r.datos.yaOpine === true, 'no reconocio su propia opinion');
    exigir(r.datos.resenas.filter((x) => x.esMia).length === 1, 'esMia mal marcado');
  });

  await probar('sin sesión ninguna opinión sale marcada como propia', async () => {
    const r = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(!r.datos.resenas.some((x) => x.esMia), 'marco una como propia sin sesion');
    exigir(r.datos.yaOpine === false, 'yaOpine en true sin sesion');
  });

  await probar('se rechaza una calificación fuera de rango', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: t2,
      cuerpo: opinion(9, 4, 4, 'Le pongo nueve estrellas a ver si el servidor me lo acepta.'),
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('se rechaza un comentario demasiado corto', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: t2,
      cuerpo: opinion(4, 4, 4, 'Bien'),
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('se rechaza un barrio que no tiene letras ni números', async () => {
    const r = await api('/barrios/resenas', {
      metodo: 'POST',
      token: t2,
      cuerpo: { ...opinion(4, 4, 4, 'Un barrio escrito solo con simbolos raros a proposito.'), barrio: '---' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('nadie puede borrar la opinión de otro', async () => {
    const r = await api(`/barrios/resenas/${idPrimera}`, { metodo: 'DELETE', token: t2 });
    exigir(r.estado === 400, `estado ${r.estado}`);
    const lista = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(lista.datos.total === 3, 'la opinion desaparecio de todas formas');
  });

  await probar('cada quien puede borrar la suya', async () => {
    const r = await api(`/barrios/resenas/${idPrimera}`, { metodo: 'DELETE', token: t1 });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const lista = await api(`/barrios/resenas/${encodeURIComponent(BARRIO)}`);
    exigir(lista.datos.total === 2, `quedaron ${lista.datos.total}`);
    exigir(lista.datos.promedios === null, 'sigue mostrando promedio con solo dos');
    return 'y al bajar de tres, el promedio se deja de mostrar';
  });

  await probar('el listado de moderación exige ser administrador', async () => {
    const r = await api('/admin/resenas-barrio', { token: t2 });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });

  await probar('sin sesión tampoco se ve el listado de moderación', async () => {
    const r = await api('/admin/resenas-barrio');
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('un barrio del que nadie ha hablado responde vacío', async () => {
    const r = await api('/barrios/resenas/Barrio%20Que%20No%20Existe');
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.total === 0, `total ${r.datos.total}`);
    exigir(r.datos.promedios === null, 'invento un promedio');
  });
} finally {
  await prisma.resenaBarrio.deleteMany({ where: { autor: { email: { in: Object.values(correos) } } } });
  await prisma.usuario.deleteMany({ where: { email: { in: Object.values(correos) } } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
