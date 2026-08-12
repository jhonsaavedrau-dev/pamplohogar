// Verifica el chat entre estudiante y arrendador.
//   node pruebas/prueba-mensajes.mjs [direccion]

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando el chat contra ${BASE}\n`);

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
  estudiante: `msg-est-${suf}@test.com`,
  intruso: `msg-int-${suf}@test.com`,
  arrendador: `msg-arr-${suf}@test.com`,
};

const registrar = async (email, rol, nombre) => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre,
      email,
      password: 'clave12345',
      rol,
      ...(rol === 'ARRENDADOR' ? { telefono: '3001112233' } : {}),
    },
  });
  exigir(r.datos?.token, `no se pudo registrar ${email}: estado ${r.estado}`);
  return r.datos.token;
};

let tEst = '';
let tInt = '';
let tArr = '';
let idInmueble = '';
let idConversacion = '';

try {
  tEst = await registrar(correos.estudiante, 'ESTUDIANTE', 'Carolina Suarez Mejia');
  tInt = await registrar(correos.intruso, 'ESTUDIANTE', 'Intruso Curioso');
  tArr = await registrar(correos.arrendador, 'ARRENDADOR', 'Don Alfonso Rangel');

  const pub = await api('/inmuebles', {
    metodo: 'POST',
    token: tArr,
    cuerpo: {
      titulo: 'Habitacion de prueba para el chat',
      descripcion: 'Publicacion creada solo para comprobar que el chat funciona de punta a punta.',
      tipo: 'HABITACION',
      precio: 300000,
      barrio: 'El Buque',
      direccion: 'Calle 1 # 1-01',
      lat: 7.372,
      lng: -72.653,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi'],
      amoblado: true,
      fotos: [],
    },
  });
  exigir(pub.estado === 201, `no se pudo publicar: estado ${pub.estado}`);
  idInmueble = pub.datos.inmueble.id;

  await probar('sin sesión no se abre una conversación', async () => {
    const r = await api('/conversaciones', { metodo: 'POST', cuerpo: { inmuebleId: idInmueble } });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('el arrendador no puede escribirse a sí mismo', async () => {
    const r = await api('/conversaciones', {
      metodo: 'POST',
      token: tArr,
      cuerpo: { inmuebleId: idInmueble },
    });
    exigir(r.estado === 403 || r.estado === 400, `estado ${r.estado}`);
  });

  await probar('el estudiante abre la conversación', async () => {
    const r = await api('/conversaciones', {
      metodo: 'POST',
      token: tEst,
      cuerpo: { inmuebleId: idInmueble },
    });
    exigir(r.estado === 201, `estado ${r.estado}`);
    idConversacion = r.datos.conversacionId;
    return 'desde la ficha del inmueble';
  });

  await probar('volver a abrirla devuelve el mismo hilo', async () => {
    const r = await api('/conversaciones', {
      metodo: 'POST',
      token: tEst,
      cuerpo: { inmuebleId: idInmueble },
    });
    exigir(r.datos.conversacionId === idConversacion, 'creo un hilo nuevo');
    const bandeja = await api('/conversaciones', { token: tEst });
    exigir(bandeja.datos.conversaciones.length === 1, 'hay hilos duplicados');
    return 'volver a la ficha no borra lo hablado';
  });

  await probar('el estudiante escribe y el arrendador lo ve', async () => {
    const env = await api(`/conversaciones/${idConversacion}/mensajes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: { texto: 'Buenas, sigue disponible la habitacion? Puedo ir a verla manana.' },
    });
    exigir(env.estado === 201, `estado ${env.estado}`);

    const vista = await api(`/conversaciones/${idConversacion}`, { token: tArr });
    exigir(vista.estado === 200, `el arrendador no la pudo abrir: ${vista.estado}`);
    exigir(vista.datos.mensajes.length === 1, `vio ${vista.datos.mensajes.length} mensajes`);
    exigir(vista.datos.mensajes[0].mio === false, 'lo marco como propio');
    exigir(vista.datos.conversacion.soyElArrendador === true, 'no lo reconocio como arrendador');
  });

  await probar('cada uno ve el nombre de pila del otro', async () => {
    const delEstudiante = await api(`/conversaciones/${idConversacion}`, { token: tEst });
    const delArrendador = await api(`/conversaciones/${idConversacion}`, { token: tArr });
    exigir(delEstudiante.datos.conversacion.con === 'Don', `vio "${delEstudiante.datos.conversacion.con}"`);
    exigir(delArrendador.datos.conversacion.con === 'Carolina', `vio "${delArrendador.datos.conversacion.con}"`);
    return 'sin apellidos, igual que en el resto de la plataforma';
  });

  await probar('el correo y el celular no viajan en el chat', async () => {
    const r = await api(`/conversaciones/${idConversacion}`, { token: tEst });
    const texto = JSON.stringify(r.datos);
    exigir(!texto.includes(correos.arrendador), 'se filtro el correo del arrendador');
    exigir(!texto.includes('3001112233'), 'se filtro el celular');
  });

  await probar('abrir el hilo marca lo del otro como leído', async () => {
    // El arrendador ya lo abrio en la prueba anterior.
    const r = await api(`/conversaciones/${idConversacion}`, { token: tEst });
    exigir(r.datos.mensajes[0].leido === true, 'sigue sin marcarse como leido');
  });

  await probar('el punto de sin leer cuenta bien', async () => {
    const antes = await api('/mensajes/sin-leer', { token: tEst });
    exigir(antes.datos.sinLeer === 0, `el estudiante tenia ${antes.datos.sinLeer}`);

    await api(`/conversaciones/${idConversacion}/mensajes`, {
      metodo: 'POST',
      token: tArr,
      cuerpo: { texto: 'Buenas, si esta disponible. Venga manana a las tres si le sirve.' },
    });

    const despues = await api('/mensajes/sin-leer', { token: tEst });
    exigir(despues.datos.sinLeer === 1, `quedo en ${despues.datos.sinLeer}`);
    return 'y no cuenta los propios';
  });

  await probar('la bandeja muestra lo último y cuántos faltan por leer', async () => {
    const r = await api('/conversaciones', { token: tEst });
    const c = r.datos.conversaciones[0];
    exigir(c.sinLeer === 1, `sinLeer ${c.sinLeer}`);
    exigir(c.ultimoMensaje.startsWith('Buenas, si esta disponible'), `ultimo: ${c.ultimoMensaje}`);
    exigir(c.con === 'Don', `con "${c.con}"`);
  });

  await probar('un tercero no puede leer la conversación', async () => {
    const r = await api(`/conversaciones/${idConversacion}`, { token: tInt });
    exigir(r.estado === 403, `estado ${r.estado}`);
    return 'ni aunque tenga sesion valida';
  });

  await probar('un tercero tampoco puede escribir en ella', async () => {
    const r = await api(`/conversaciones/${idConversacion}/mensajes`, {
      metodo: 'POST',
      token: tInt,
      cuerpo: { texto: 'Me meto en una conversacion que no es mia a ver que pasa.' },
    });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });

  await probar('la bandeja de un tercero sale vacía', async () => {
    const r = await api('/conversaciones', { token: tInt });
    exigir(r.datos.conversaciones.length === 0, `vio ${r.datos.conversaciones.length}`);
  });

  await probar('no se envía un mensaje vacío', async () => {
    const r = await api(`/conversaciones/${idConversacion}/mensajes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: { texto: '   ' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('no se envía un mensaje larguísimo', async () => {
    const r = await api(`/conversaciones/${idConversacion}/mensajes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: { texto: 'a'.repeat(2001) },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('una conversación inventada no existe', async () => {
    const r = await api('/conversaciones/esto-no-existe', { token: tEst });
    exigir(r.estado === 404, `estado ${r.estado}`);
  });

  await probar('no se abre chat sobre una publicación retirada', async () => {
    await api(`/inmuebles/${idInmueble}`, {
      metodo: 'PATCH',
      token: tArr,
      cuerpo: { activo: false },
    });
    const r = await api('/conversaciones', {
      metodo: 'POST',
      token: tInt,
      cuerpo: { inmuebleId: idInmueble },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);

    // Pero el hilo que ya existia se sigue pudiendo leer y responder.
    const vieja = await api(`/conversaciones/${idConversacion}`, { token: tEst });
    exigir(vieja.estado === 200, `el hilo viejo se cerro: ${vieja.estado}`);
    await api(`/inmuebles/${idInmueble}`, { metodo: 'PATCH', token: tArr, cuerpo: { activo: true } });
    return 'y lo ya hablado no se pierde al retirarla';
  });

  await probar('la bandeja ordena por lo más reciente', async () => {
    const otro = await api('/inmuebles', {
      metodo: 'POST',
      token: tArr,
      cuerpo: {
        titulo: 'Segunda habitacion de prueba para el chat',
        descripcion: 'Otra publicacion para comprobar que la bandeja ordena por lo mas reciente.',
        tipo: 'HABITACION',
        precio: 310000,
        barrio: 'El Buque',
        direccion: 'Calle 2 # 2-02',
        lat: 7.373,
        lng: -72.654,
        habitaciones: 1,
        banos: 1,
        servicios: ['wifi'],
        amoblado: true,
        fotos: [],
      },
    });
    const nueva = await api('/conversaciones', {
      metodo: 'POST',
      token: tEst,
      cuerpo: { inmuebleId: otro.datos.inmueble.id },
    });
    await api(`/conversaciones/${nueva.datos.conversacionId}/mensajes`, {
      metodo: 'POST',
      token: tEst,
      cuerpo: { texto: 'Y esta otra habitacion, tambien sigue disponible?' },
    });

    const r = await api('/conversaciones', { token: tEst });
    exigir(r.datos.conversaciones.length === 2, `hay ${r.datos.conversaciones.length}`);
    exigir(
      r.datos.conversaciones[0].id === nueva.datos.conversacionId,
      'la mas reciente no quedo primero',
    );
    return 'dos inmuebles del mismo arrendador son dos hilos aparte';
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
