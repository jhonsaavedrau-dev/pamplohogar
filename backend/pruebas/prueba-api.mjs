// Por defecto prueba el servidor local. Para probar el de internet:
//   node pruebas/prueba-api.mjs https://pamplohogar-api.onrender.com
const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
console.log(`Probando contra ${BASE}\n`);
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
    /* respuesta sin cuerpo */
  }
  return { estado: r.status, datos };
}

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

const suf = Math.floor(Math.random() * 999999);
let tokenArr = '';
let tokenEst = '';
let idInmueble = '';

await probar('registro de arrendador', async () => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Arrendador',
      email: `arr${suf}@test.com`,
      password: 'clave12345',
      telefono: '3001112233',
      rol: 'ARRENDADOR',
    },
  });
  exigir(r.estado === 201, `estado ${r.estado}`);
  exigir(!('passwordHash' in r.datos.usuario), 'FUGA: devolvio passwordHash');
  tokenArr = r.datos.token;
  return 'token recibido, sin passwordHash';
});

await probar('registro de estudiante', async () => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Estudiante',
      email: `est${suf}@test.com`,
      password: 'clave12345',
      rol: 'ESTUDIANTE',
    },
  });
  exigir(r.estado === 201, `estado ${r.estado}`);
  tokenEst = r.datos.token;
});

await probar('login correcto', async () => {
  const r = await api('/auth/login', {
    metodo: 'POST',
    cuerpo: { email: `arr${suf}@test.com`, password: 'clave12345' },
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
});

await probar('login con clave mala devuelve 401', async () => {
  const r = await api('/auth/login', {
    metodo: 'POST',
    cuerpo: { email: `arr${suf}@test.com`, password: 'incorrecta' },
  });
  exigir(r.estado === 401, `estado ${r.estado}`);
});

await probar('registro con correo repetido devuelve 409', async () => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Otro Mas',
      email: `arr${suf}@test.com`,
      password: 'clave12345',
      rol: 'ESTUDIANTE',
    },
  });
  exigir(r.estado === 409, `estado ${r.estado}`);
});

await probar('contrasena corta es rechazada', async () => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: { nombre: 'Corto Test', email: `x${suf}@test.com`, password: '123', rol: 'ESTUDIANTE' },
  });
  exigir(r.estado === 400, `estado ${r.estado}`);
  return r.datos.mensaje;
});

await probar('arrendador crea inmueble', async () => {
  const r = await api('/inmuebles', {
    metodo: 'POST',
    token: tokenArr,
    cuerpo: {
      titulo: 'Habitacion de prueba automatizada',
      descripcion: 'Descripcion suficientemente larga para pasar la validacion del servidor.',
      tipo: 'HABITACION',
      precio: 400000,
      barrio: 'Centro',
      direccion: 'Calle 1 # 2-3',
      lat: 7.3768,
      lng: -72.6474,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua'],
      amoblado: true,
      fotos: [],
    },
  });
  exigir(r.estado === 201, `estado ${r.estado}`);
  idInmueble = r.datos.inmueble.id;
});

await probar('estudiante NO puede publicar inmueble (403)', async () => {
  const r = await api('/inmuebles', {
    metodo: 'POST',
    token: tokenEst,
    cuerpo: {
      titulo: 'Esto no se deberia crear jamas',
      descripcion: 'Descripcion suficientemente larga para pasar la validacion del servidor.',
      tipo: 'CASA',
      precio: 400000,
      barrio: 'X',
      direccion: 'Calle 1',
      lat: 7.3,
      lng: -72.6,
      habitaciones: 1,
      banos: 1,
      servicios: [],
      amoblado: false,
      fotos: [],
    },
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

await probar('estudiante NO puede editar inmueble ajeno (403)', async () => {
  const r = await api(`/inmuebles/${idInmueble}`, {
    metodo: 'PATCH',
    token: tokenEst,
    cuerpo: { precio: 1 },
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

await probar('estudiante NO puede borrar inmueble ajeno (403)', async () => {
  const r = await api(`/inmuebles/${idInmueble}`, { metodo: 'DELETE', token: tokenEst });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

await probar('sin token, favoritos devuelve 401', async () => {
  const r = await api('/favoritos');
  exigir(r.estado === 401, `estado ${r.estado}`);
});

await probar('token invalido devuelve 401', async () => {
  const r = await api('/favoritos', { token: 'basura.token.falso' });
  exigir(r.estado === 401, `estado ${r.estado}`);
});

await probar('filtro precioMax=300000 respeta el tope', async () => {
  const r = await api('/inmuebles?precioMax=300000');
  exigir(r.estado === 200, `estado ${r.estado}`);
  const caros = r.datos.inmuebles.filter((i) => i.precio > 300000);
  exigir(caros.length === 0, `devolvio ${caros.length} por encima del tope`);
  return `${r.datos.total} resultados`;
});

await probar('filtro tipo=APARTAESTUDIO', async () => {
  const r = await api('/inmuebles?tipo=APARTAESTUDIO');
  const otros = r.datos.inmuebles.filter((i) => i.tipo !== 'APARTAESTUDIO');
  exigir(otros.length === 0, 'devolvio otros tipos');
  return `${r.datos.total} resultados`;
});

await probar('filtro por servicio wifi', async () => {
  const r = await api('/inmuebles?servicios=wifi');
  const sinWifi = r.datos.inmuebles.filter((i) => !i.servicios.includes('wifi'));
  exigir(sinWifi.length === 0, 'devolvio inmuebles sin wifi');
  return `${r.datos.total} resultados`;
});

await probar('busqueda por texto libre', async () => {
  const r = await api('/inmuebles?q=universitaria');
  return `${r.datos.total} resultados`;
});

await probar('orden precioAsc queda ordenado', async () => {
  const r = await api('/inmuebles?orden=precioAsc');
  const precios = r.datos.inmuebles.map((i) => i.precio);
  const ordenado = [...precios].sort((a, b) => a - b);
  exigir(JSON.stringify(precios) === JSON.stringify(ordenado), 'no quedo ordenado');
  return `desde ${precios[0]}`;
});

await probar('orden cercania calcula distancia', async () => {
  const r = await api('/inmuebles?orden=cercania');
  const d = r.datos.inmuebles.map((i) => i.distanciaUniversidadKm);
  const ordenado = [...d].sort((a, b) => a - b);
  exigir(JSON.stringify(d) === JSON.stringify(ordenado), 'no quedo ordenado por distancia');
  return `el mas cercano a ${d[0]} km`;
});

await probar('detalle publico NO expone el telefono', async () => {
  const r = await api(`/inmuebles/${idInmueble}`);
  exigir(r.estado === 200, `estado ${r.estado}`);
  const json = JSON.stringify(r.datos);
  exigir(!json.includes('3001112233'), 'FUGA: el telefono aparece en el detalle publico');
  return 'telefono oculto';
});

await probar('contacto revela telefono y enlace de WhatsApp', async () => {
  const r = await api(`/inmuebles/${idInmueble}/contacto`, { metodo: 'POST', token: tokenEst });
  exigir(r.estado === 200, `estado ${r.estado}`);
  exigir(r.datos.telefono === '3001112233', 'telefono incorrecto');
  exigir(r.datos.enlaceWhatsapp.startsWith('https://wa.me/57'), 'enlace mal armado');
  return r.datos.enlaceWhatsapp.slice(0, 40) + '...';
});

await probar('contacto sin sesion devuelve 401', async () => {
  const r = await api(`/inmuebles/${idInmueble}/contacto`, { metodo: 'POST' });
  exigir(r.estado === 401, `estado ${r.estado}`);
});

await probar('la solicitud de contacto queda registrada', async () => {
  const r = await api('/solicitudes', { token: tokenArr });
  exigir(r.estado === 200, `estado ${r.estado}`);
  exigir(r.datos.solicitudes.length >= 1, 'no se registro');
  return `${r.datos.solicitudes.length} solicitud(es)`;
});

await probar('guardar favorito', async () => {
  const r = await api(`/favoritos/${idInmueble}`, { metodo: 'POST', token: tokenEst });
  exigir(r.estado === 201, `estado ${r.estado}`);
});

await probar('listar favoritos', async () => {
  const r = await api('/favoritos', { token: tokenEst });
  exigir(r.datos.inmuebles.length === 1, `devolvio ${r.datos.inmuebles.length}`);
});

await probar('quitar favorito', async () => {
  await api(`/favoritos/${idInmueble}`, { metodo: 'DELETE', token: tokenEst });
  const r = await api('/favoritos', { token: tokenEst });
  exigir(r.datos.inmuebles.length === 0, 'no se quito');
});

await probar('estudiante publica resena', async () => {
  const r = await api('/resenas', {
    metodo: 'POST',
    token: tokenEst,
    cuerpo: {
      inmuebleId: idInmueble,
      calificacion: 5,
      comentario: 'Muy buena experiencia con este arrendador de prueba.',
    },
  });
  exigir(r.estado === 201, `estado ${r.estado}`);
});

await probar('la resena sube el promedio del arrendador', async () => {
  const r = await api(`/inmuebles/${idInmueble}`);
  exigir(r.datos.inmueble.arrendador.calificacionPromedio === 5, 'promedio incorrecto');
  return '5.0 estrellas';
});

await probar('arrendador NO puede resenarse a si mismo', async () => {
  const r = await api('/resenas', {
    metodo: 'POST',
    token: tokenArr,
    cuerpo: {
      inmuebleId: idInmueble,
      calificacion: 5,
      comentario: 'Me califico solo, esto no deberia pasar.',
    },
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

await probar('el dueno SI puede ocultar su inmueble', async () => {
  const r = await api(`/inmuebles/${idInmueble}`, {
    metodo: 'PATCH',
    token: tokenArr,
    cuerpo: { activo: false },
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
  const lista = await api('/inmuebles?q=automatizada');
  exigir(lista.datos.total === 0, 'sigue apareciendo en el listado publico');
  return 'oculto y fuera del listado';
});

await probar('el dueno elimina su inmueble', async () => {
  const r = await api(`/inmuebles/${idInmueble}`, { metodo: 'DELETE', token: tokenArr });
  exigir(r.estado === 200, `estado ${r.estado}`);
});

await probar('precio invalido es rechazado', async () => {
  const r = await api('/inmuebles', {
    metodo: 'POST',
    token: tokenArr,
    cuerpo: {
      titulo: 'Titulo valido de prueba aqui',
      descripcion: 'Descripcion suficientemente larga para pasar la validacion del servidor.',
      tipo: 'CASA',
      precio: 10,
      barrio: 'Centro',
      direccion: 'Calle 1',
      lat: 7.3,
      lng: -72.6,
      habitaciones: 1,
      banos: 1,
      servicios: [],
      amoblado: false,
      fotos: [],
    },
  });
  exigir(r.estado === 400, `estado ${r.estado}`);
  return r.datos.mensaje;
});

await probar('ruta inexistente devuelve mensaje en espanol', async () => {
  const r = await api('/no-existe-esta-ruta');
  exigir(r.estado === 404, `estado ${r.estado}`);
  return r.datos.mensaje;
});

console.log(`\n=================================`);
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log(`=================================`);
process.exit(fallas > 0 ? 1 : 0);
