// Verifica los reportes de publicaciones y el historial de precios.
//   node pruebas/prueba-reportes.mjs [direccion]
import { PrismaClient } from '@prisma/client';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = new PrismaClient({ log: ['error'] });

console.log(`Probando reportes e historial contra ${BASE}\n`);

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
  admin: `rep-admin${suf}@test.com`,
  arrendador: `rep-arr${suf}@test.com`,
  estudiante: `rep-est${suf}@test.com`,
  otro: `rep-otro${suf}@test.com`,
};

let tAdmin = '';
let tArr = '';
let tEst = '';
let tOtro = '';
let idInmueble = '';
let idReporte = '';

async function crear(correo, rol, telefono) {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Prueba Reportes',
      email: correo,
      password: 'clave12345',
      rol,
      ...(telefono ? { telefono } : {}),
    },
  });
  return r.datos.token;
}

try {
  tAdmin = await crear(correos.admin, 'ESTUDIANTE');
  tArr = await crear(correos.arrendador, 'ARRENDADOR', '3001234567');
  tEst = await crear(correos.estudiante, 'ESTUDIANTE');
  tOtro = await crear(correos.otro, 'ESTUDIANTE');
  await prisma.usuario.update({ where: { email: correos.admin }, data: { rol: 'ADMIN' } });

  const nuevo = await api('/inmuebles', {
    metodo: 'POST',
    token: tArr,
    cuerpo: {
      titulo: 'Inmueble para probar reportes y precios',
      descripcion: 'Descripcion suficientemente larga para pasar la validacion del servidor.',
      tipo: 'HABITACION',
      precio: 400000,
      barrio: 'Centro',
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
  idInmueble = nuevo.datos.inmueble.id;

  console.log('--- reportar una publicacion ---');

  await probar('sin sesion no se puede reportar', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      cuerpo: { motivo: 'PRECIO_ABUSIVO', detalle: 'Esto deberia rechazarse por falta de sesion.' },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('un estudiante reporta la publicacion', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: {
        motivo: 'PRECIO_ABUSIVO',
        detalle: 'Me cobraron el doble de lo que dice la publicacion cuando llegue.',
      },
    });
    exigir(r.estado === 201, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('un detalle muy corto se rechaza', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      token: tOtro,
      cuerpo: { motivo: 'OTRO', detalle: 'malo' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('un motivo inventado se rechaza', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      token: tOtro,
      cuerpo: { motivo: 'PORQUE_SI', detalle: 'Un detalle suficientemente largo para pasar.' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('el dueno no puede reportar su propio inmueble', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      token: tArr,
      cuerpo: { motivo: 'OTRO', detalle: 'Reportandome a mi mismo, no deberia poder.' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
    return r.datos.mensaje;
  });

  await probar('reportar dos veces no duplica, actualiza el mismo', async () => {
    await api(`/inmuebles/${idInmueble}/reportes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: { motivo: 'NO_EXISTE', detalle: 'Fui a la direccion y esa casa no existe.' },
    });
    const total = await prisma.reporte.count({ where: { inmuebleId: idInmueble } });
    exigir(total === 1, `hay ${total} reportes de la misma persona`);
    return '1 solo reporte';
  });

  await probar('el estudiante puede ver el reporte que hizo', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes/mio`, { token: tEst });
    exigir(r.datos.reporte !== null, 'no lo encontro');
    exigir(r.datos.reporte.motivo === 'NO_EXISTE', 'no guardo el motivo nuevo');
  });

  await probar('quien no reporto no ve nada', async () => {
    const r = await api(`/inmuebles/${idInmueble}/reportes/mio`, { token: tOtro });
    exigir(r.datos.reporte === null, 'devolvio un reporte ajeno');
  });

  console.log('\n--- el panel recibe los reportes ---');

  await probar('un estudiante no puede ver la cola de reportes', async () => {
    const r = await api('/admin/reportes', { token: tEst });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });

  await probar('el administrador ve el reporte pendiente', async () => {
    const r = await api('/admin/reportes', { token: tAdmin });
    exigir(r.estado === 200, `estado ${r.estado}`);
    const mio = r.datos.reportes.find((x) => x.inmueble.id === idInmueble);
    exigir(mio !== undefined, 'no aparece el reporte');
    exigir(mio.autor.email === correos.estudiante, 'no dice quien reporto');
    idReporte = mio.id;
    return `${r.datos.pendientes} pendientes en total`;
  });

  await probar('el administrador marca el reporte como atendido', async () => {
    const r = await api(`/admin/reportes/${idReporte}`, {
      metodo: 'PATCH',
      token: tAdmin,
      cuerpo: { estado: 'ATENDIDO', notaAdmin: 'Retire la publicacion y avise al arrendador.' },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.reporte.estado === 'ATENDIDO', 'no cambio el estado');
  });

  await probar('el atendido sale de la cola de pendientes', async () => {
    const r = await api('/admin/reportes?estado=PENDIENTE', { token: tAdmin });
    const sigue = r.datos.reportes.some((x) => x.id === idReporte);
    exigir(!sigue, 'sigue apareciendo como pendiente');
  });

  await probar('queda registrado quien lo atendio', async () => {
    const r = await api('/admin/reportes?estado=ATENDIDO', { token: tAdmin });
    const mio = r.datos.reportes.find((x) => x.id === idReporte);
    exigir(mio.atendidoPor !== null, 'no dice quien lo atendio');
    exigir(mio.notaAdmin !== null, 'no guardo la nota');
    return `atendido por ${mio.atendidoPor}`;
  });

  console.log('\n--- historial de precios ---');

  await probar('un inmueble nuevo no tiene historial', async () => {
    const r = await api(`/inmuebles/${idInmueble}`);
    exigir(r.datos.cambiosDePrecio.length === 0, 'trae historial sin haber cambiado nada');
  });

  await probar('subir el precio queda registrado', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { precio: 550000 },
    });
    const r = await api(`/inmuebles/${idInmueble}`);
    exigir(r.datos.cambiosDePrecio.length === 1, 'no lo registro');
    const c = r.datos.cambiosDePrecio[0];
    exigir(c.precioAnterior === 400000 && c.precioNuevo === 550000, 'guardo mal los valores');
    return '400.000 a 550.000';
  });

  await probar('guardar sin cambiar el precio no ensucia el historial', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { precio: 550000, barrio: 'Centro' },
    });
    const r = await api(`/inmuebles/${idInmueble}`);
    exigir(r.datos.cambiosDePrecio.length === 1, `quedaron ${r.datos.cambiosDePrecio.length}`);
  });

  await probar('bajar el precio tambien queda registrado', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { precio: 480000 },
    });
    const r = await api(`/inmuebles/${idInmueble}`);
    exigir(r.datos.cambiosDePrecio.length === 2, 'no lo registro');
    return '550.000 a 480.000';
  });

  await probar('el historial queda en orden cronologico', async () => {
    const r = await api(`/inmuebles/${idInmueble}`);
    const fechas = r.datos.cambiosDePrecio.map((c) => new Date(c.creadoEn).getTime());
    exigir(fechas[0] <= fechas[1], 'quedo al reves');
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
