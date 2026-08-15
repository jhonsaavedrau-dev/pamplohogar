/*
  Prueba de carga: mil estudiantes usando la plataforma al mismo tiempo.

  No comprueba que las respuestas sean correctas, para eso estan las otras
  pruebas. Esta mide otra cosa: cuanto aguanta y donde se pone lento cuando
  llega el semestre y entra medio campus a la vez.

  Que simula, en este orden:

    1. Arrendadores publicando, para que haya que buscar sobre algo real.
    2. Mil estudiantes creando cuenta.
    3. Los mil entrando con su clave.
    4. Los mil usando la plataforma: buscar, filtrar, abrir fichas, guardar
       favoritos, contactar, escribir por el chat, guardar busquedas, poner
       resenas, mirar el mapa de precios, reportar.
    5. Los arrendadores revisando quien les escribio.
    6. El goteo del chat: la pantalla de mensajes pregunta cada ocho segundos
       si hay algo nuevo. Con mil personas dentro eso solo ya es trafico
       constante, y conviene saber cuanto.
    7. El wifi de la universidad: que pasa si los mil salen a internet con la
       misma direccion, como pasa de verdad en el campus.

  Cada usuario simulado sale con su propia direccion de internet, igual que
  mil celulares con datos. Se manda en la cabecera X-Forwarded-For, que es lo
  que el servidor ya lee para contar intentos, porque en internet vive detras
  del proxy de Render.

  Todo lo que crea lo borra al final. Los correos terminan en @test.com, asi
  que si la prueba se corta a la mitad queda:

    npm run limpiar-pruebas -- --confirmar

  Uso:

    node pruebas/prueba-carga.mjs
    USUARIOS=200 SIMULTANEOS=40 node pruebas/prueba-carga.mjs
*/

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;

const USUARIOS = Number(process.env.USUARIOS ?? 1000);
const SIMULTANEOS = Number(process.env.SIMULTANEOS ?? 60);
const ARRENDADORES = Number(process.env.ARRENDADORES ?? 30);
const INMUEBLES_POR_ARRENDADOR = Number(process.env.INMUEBLES_POR_ARRENDADOR ?? 5);
const CLAVE = 'carga12345';

const prisma = baseDeLaPrueba(RAIZ);
const SUF = Math.floor(Math.random() * 999999);
const correo = (quien, i) => `carga-${quien}-${i}-${SUF}@test.com`;

/* ---------------------------------------------------------------- medicion */

/** @type {Map<string, {tiempos: number[], estados: Map<number, number>}>} */
const medidas = new Map();

/*
  Por que se cayo una peticion, no solo cuantas.

  Un "sin respuesta" puede ser que el servidor se quedo sin aire, que la
  conexion tardo tanto en abrirse que el cliente se rindio, o que se corto a
  medio camino. Son problemas distintos y se arreglan distinto, asi que se
  guarda el motivo exacto.
*/
/** @type {Map<string, number>} */
const causasSinRespuesta = new Map();

function anotar(accion, estado, ms) {
  let m = medidas.get(accion);
  if (!m) {
    m = { tiempos: [], estados: new Map() };
    medidas.set(accion, m);
  }
  m.tiempos.push(ms);
  m.estados.set(estado, (m.estados.get(estado) ?? 0) + 1);
}

function percentil(ordenados, p) {
  if (ordenados.length === 0) return 0;
  const i = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[i];
}

const redondear = (n) => Math.round(n);

/* ------------------------------------------------------------- peticiones */

async function api(ruta, { metodo = 'GET', cuerpo, token, ip, accion } = {}) {
  const headers = {};
  if (ip) headers['X-Forwarded-For'] = ip;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo) headers['Content-Type'] = 'application/json';

  const arranque = performance.now();
  let estado = 0;
  let datos = null;
  try {
    const r = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    estado = r.status;
    const texto = await r.text();
    try {
      datos = JSON.parse(texto);
    } catch {
      /* respuesta sin cuerpo */
    }
  } catch (error) {
    // El servidor ni contesto: conexion rechazada, cortada o vencida.
    estado = 0;
    const motivo = error?.cause?.code ?? error?.code ?? error?.cause?.message ?? String(error);
    const clave = `${accion ?? ruta}: ${error?.message ?? 'fallo'} (${motivo})`;
    causasSinRespuesta.set(clave, (causasSinRespuesta.get(clave) ?? 0) + 1);
    datos = { mensaje: clave };
  }
  anotar(accion ?? `${metodo} ${ruta}`, estado, performance.now() - arranque);
  return { estado, datos };
}

/**
 * Corre la misma tarea sobre muchos elementos, pero con un tope de cuantas
 * van a la vez. Mil peticiones disparadas de golpe no miden el servidor sino
 * el limite de conexiones de este computador.
 */
async function enTandas(items, simultaneos, tarea) {
  const resultados = new Array(items.length);
  let siguiente = 0;
  const cuantos = Math.max(1, Math.min(simultaneos, items.length));
  await Promise.all(
    Array.from({ length: cuantos }, async () => {
      for (;;) {
        const i = siguiente++;
        if (i >= items.length) return;
        try {
          resultados[i] = await tarea(items[i], i);
        } catch (error) {
          resultados[i] = { error: error instanceof Error ? error.message : String(error) };
        }
      }
    }),
  );
  return resultados;
}

const numeros = (n) => Array.from({ length: n }, (_, i) => i);
const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/* --------------------------------------------------------- datos de mentira */

const BARRIOS = [
  'Centro',
  'El Buque',
  'Juan XXIII',
  'La Feria',
  'Cristo Rey',
  'San Francisco',
  'El Escorial',
  'Santa Marta',
  'Chapinero',
  'Villa Marina',
];
const TIPOS = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'];
const SERVICIOS = ['wifi', 'agua', 'luz', 'gas', 'cocina', 'lavadora', 'parqueadero', 'estudio'];
const CARRERAS = ['Ingenieria de Sistemas', 'Derecho', 'Psicologia', 'Medicina', 'Educacion'];
const MOTIVOS = ['PRECIO_ABUSIVO', 'INFORMACION_FALSA', 'NO_EXISTE', 'NO_RESPONDE'];

// Coordenadas alrededor de Pamplona, para que la distancia a la universidad
// de numeros de verdad y el orden por cercania tenga que calcular algo.
const laUniversidad = { lat: 7.3768, lng: -72.6474 };
const cerca = () => ({
  lat: laUniversidad.lat + (Math.random() - 0.5) * 0.03,
  lng: laUniversidad.lng + (Math.random() - 0.5) * 0.03,
});

// Una direccion de internet distinta por persona, como mil celulares con datos.
const ipDe = (n) => `191.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;

/* ------------------------------------------------------------------ arranque */

const linea = (t = '') => process.stdout.write(`${t}\n`);

linea(`\nPrueba de carga contra ${BASE}`);
linea(`${USUARIOS} estudiantes, ${SIMULTANEOS} peticiones a la vez como maximo.\n`);

const salud = await api('/salud', { accion: 'salud' });
if (salud.estado !== 200) {
  linea('El servidor no responde. Enciendelo primero con: npm run dev\n');
  await prisma.$disconnect();
  process.exit(1);
}

const arranqueTotal = performance.now();
const cronometro = () => `${((performance.now() - arranqueTotal) / 1000).toFixed(1)}s`;

/* ------------------------------------------- 1. arrendadores publicando */

linea(`[${cronometro()}] 1. ${ARRENDADORES} arrendadores creando cuenta y publicando...`);

const arrendadores = [];
await enTandas(numeros(ARRENDADORES), SIMULTANEOS, async (i) => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    ip: ipDe(900000 + i),
    accion: 'registro (arrendador)',
    cuerpo: {
      nombre: `Arrendador Carga ${i}`,
      email: correo('arr', i),
      password: CLAVE,
      telefono: `300${String(1000000 + i).slice(0, 7)}`,
      rol: 'ARRENDADOR',
    },
  });
  if (r.estado === 201) arrendadores.push({ i, token: r.datos.token });
});

const inmuebles = [];
await enTandas(arrendadores, SIMULTANEOS, async (arr) => {
  for (let n = 0; n < INMUEBLES_POR_ARRENDADOR; n++) {
    const tipo = alAzar(TIPOS);
    const punto = cerca();
    const r = await api('/inmuebles', {
      metodo: 'POST',
      token: arr.token,
      ip: ipDe(900000 + arr.i),
      accion: 'publicar inmueble',
      cuerpo: {
        titulo: `${tipo === 'HABITACION' ? 'Habitacion' : 'Vivienda'} estudiantil de prueba ${arr.i}-${n}`,
        descripcion:
          'Publicacion creada por la prueba de carga para medir cuanto aguanta la plataforma con mucha gente adentro.',
        tipo,
        precio: entre(250000, 1200000),
        barrio: alAzar(BARRIOS),
        direccion: `Calle ${entre(1, 30)} # ${entre(1, 20)}-${entre(1, 90)}`,
        lat: punto.lat,
        lng: punto.lng,
        habitaciones: entre(1, 4),
        banos: entre(1, 3),
        servicios: SERVICIOS.filter(() => Math.random() < 0.4),
        amoblado: Math.random() < 0.5,
        fotos: [],
      },
    });
    if (r.estado === 201) inmuebles.push(r.datos.inmueble.id);
  }
});

linea(`   ${arrendadores.length} arrendadores, ${inmuebles.length} inmuebles publicados.`);

if (inmuebles.length === 0) {
  linea('\nNo se pudo publicar nada, la prueba no tendria sobre que buscar.\n');
  await prisma.$disconnect();
  process.exit(1);
}

/* ----------------------------------------------- 2. mil cuentas nuevas */

linea(`\n[${cronometro()}] 2. ${USUARIOS} estudiantes creando cuenta...`);
const arranqueRegistro = performance.now();

const estudiantes = [];
await enTandas(numeros(USUARIOS), SIMULTANEOS, async (i) => {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    ip: ipDe(i),
    accion: 'registro (estudiante)',
    cuerpo: {
      nombre: `Estudiante Carga ${i}`,
      email: correo('est', i),
      password: CLAVE,
      rol: 'ESTUDIANTE',
    },
  });
  if (r.estado === 201) estudiantes.push({ i, token: r.datos.token });
});

const segundosRegistro = (performance.now() - arranqueRegistro) / 1000;
linea(
  `   ${estudiantes.length} cuentas creadas en ${segundosRegistro.toFixed(1)}s ` +
    `(${(estudiantes.length / segundosRegistro).toFixed(1)} por segundo).`,
);

/* ------------------------------------------------------ 3. todos entrando */

linea(`\n[${cronometro()}] 3. Los ${estudiantes.length} entrando con su clave...`);
const arranqueEntrada = performance.now();

await enTandas(estudiantes, SIMULTANEOS, async (est) => {
  const r = await api('/auth/login', {
    metodo: 'POST',
    ip: ipDe(est.i),
    accion: 'entrar (login)',
    cuerpo: { email: correo('est', est.i), password: CLAVE },
  });
  if (r.estado === 200) est.token = r.datos.token;
});

const segundosEntrada = (performance.now() - arranqueEntrada) / 1000;
linea(
  `   ${estudiantes.length} entradas en ${segundosEntrada.toFixed(1)}s ` +
    `(${(estudiantes.length / segundosEntrada).toFixed(1)} por segundo).`,
);

/* -------------------------------------------- 4. todos usando la plataforma */

linea(`\n[${cronometro()}] 4. Los ${estudiantes.length} usando la plataforma...`);
const arranqueUso = performance.now();

await enTandas(estudiantes, SIMULTANEOS, async (est) => {
  const yo = { token: est.token, ip: ipDe(est.i) };
  const inmuebleId = alAzar(inmuebles);
  const barrio = alAzar(BARRIOS);
  const dado = Math.random();

  // Lo que hace todo el mundo: abrir la pagina, filtrar y mirar una ficha.
  await api('/inmuebles?pagina=1&orden=recientes', { ...yo, accion: 'listado de inmuebles' });
  await api(
    `/inmuebles?precioMax=${entre(400000, 900000)}&tipo=${alAzar(TIPOS)}&orden=${alAzar(['precioAsc', 'cercania'])}`,
    { ...yo, accion: 'busqueda con filtros' },
  );
  await api(`/inmuebles/${inmuebleId}`, { ...yo, accion: 'ficha del inmueble' });
  await api('/inmuebles/barrios', { ...yo, accion: 'lista de barrios' });
  await api('/mensajes/sin-leer', { ...yo, accion: 'chat: revisar sin leer' });

  if (dado < 0.6) {
    await api(`/favoritos/${inmuebleId}`, { ...yo, metodo: 'POST', accion: 'guardar favorito' });
    await api('/favoritos', { ...yo, accion: 'ver mis favoritos' });
  }

  if (dado < 0.4) {
    await api(`/inmuebles/${inmuebleId}/contacto`, {
      ...yo,
      metodo: 'POST',
      accion: 'pedir el contacto',
    });
  }

  if (dado < 0.35) {
    const c = await api('/conversaciones', {
      ...yo,
      metodo: 'POST',
      accion: 'chat: abrir hilo',
      cuerpo: { inmuebleId },
    });
    if (c.estado === 201) {
      await api(`/conversaciones/${c.datos.conversacionId}/mensajes`, {
        ...yo,
        metodo: 'POST',
        accion: 'chat: enviar mensaje',
        cuerpo: { texto: 'Hola, buenas. Sigue disponible la habitacion?' },
      });
      await api(`/conversaciones/${c.datos.conversacionId}`, { ...yo, accion: 'chat: leer hilo' });
    }
  }

  if (dado < 0.3) {
    await api('/busquedas', {
      ...yo,
      metodo: 'POST',
      accion: 'guardar la busqueda',
      cuerpo: {
        nombre: `Lo que busco ${est.i}`,
        avisarPorCorreo: true,
        tipo: alAzar(TIPOS),
        precioMax: entre(400000, 900000),
        servicios: ['wifi'],
      },
    });
  }

  if (dado < 0.25) {
    await api('/roomies/mio', {
      ...yo,
      metodo: 'PUT',
      accion: 'publicar perfil de roomie',
      cuerpo: {
        presupuestoMax: entre(200000, 700000),
        descripcion:
          'Estudiante tranquilo, ordenado y con horarios normales. Busco compartir para repartir gastos del arriendo.',
        zonaPreferida: barrio,
        carrera: alAzar(CARRERAS),
        semestre: entre(1, 10),
        ritmo: alAzar(['MADRUGADOR', 'NOCTURNO', 'MIXTO']),
      },
    });
    await api('/roomies', { ...yo, accion: 'buscar roomies' });
  }

  if (dado < 0.2) {
    await api('/barrios/resenas', {
      ...yo,
      metodo: 'POST',
      accion: 'opinar sobre el barrio',
      cuerpo: {
        barrio,
        tranquilidad: entre(1, 5),
        seguridad: entre(1, 5),
        transporte: entre(1, 5),
        comentario: 'Vivi aqui un semestre y en general se puede estudiar tranquilo de noche.',
      },
    });
    await api(`/barrios/resenas/${encodeURIComponent(barrio)}`, {
      ...yo,
      accion: 'como es vivir en el barrio',
    });
  }

  if (dado < 0.18) {
    await api('/resenas', {
      ...yo,
      metodo: 'POST',
      accion: 'calificar al arrendador',
      cuerpo: {
        inmuebleId,
        calificacion: entre(3, 5),
        comentario: 'Respondio rapido y la habitacion era igual a las fotos de la publicacion.',
      },
    });
  }

  if (dado < 0.15) {
    await api(`/inmuebles/mapa-de-precios?tipo=${alAzar(TIPOS)}`, {
      ...yo,
      accion: 'mapa de precios',
    });
  }

  if (dado < 0.06) {
    await api(`/inmuebles/${inmuebleId}/reportes`, {
      ...yo,
      metodo: 'POST',
      accion: 'reportar publicacion',
      cuerpo: {
        motivo: alAzar(MOTIVOS),
        detalle: 'Me pidieron mas plata de la que aparece publicada en la pagina, cuidado con eso.',
      },
    });
  }
});

linea(`   Terminado en ${((performance.now() - arranqueUso) / 1000).toFixed(1)}s.`);

/* ------------------------------------------ 5. los arrendadores revisando */

linea(`\n[${cronometro()}] 5. Los arrendadores revisando su bandeja...`);

await enTandas(arrendadores, SIMULTANEOS, async (arr) => {
  const yo = { token: arr.token, ip: ipDe(900000 + arr.i) };
  await api('/inmuebles/mios', { ...yo, accion: 'arrendador: mis inmuebles' });
  await api('/solicitudes', { ...yo, accion: 'arrendador: quien me escribio' });
  await api('/conversaciones', { ...yo, accion: 'arrendador: bandeja del chat' });
  await api('/mensajes/sin-leer', { ...yo, accion: 'chat: revisar sin leer' });
});

/* ---------------------------------------------------- 6. el goteo del chat */

const RONDAS = 3;
linea(
  `\n[${cronometro()}] 6. El goteo del chat: ${estudiantes.length} pantallas preguntando ${RONDAS} veces...`,
);
const arranqueGoteo = performance.now();

for (let ronda = 0; ronda < RONDAS; ronda++) {
  await enTandas(estudiantes, SIMULTANEOS, async (est) =>
    api('/mensajes/sin-leer', {
      token: est.token,
      ip: ipDe(est.i),
      accion: 'chat: goteo cada 8 segundos',
    }),
  );
}

const segundosGoteo = (performance.now() - arranqueGoteo) / 1000;
const preguntasGoteo = estudiantes.length * RONDAS;
linea(
  `   ${preguntasGoteo} preguntas en ${segundosGoteo.toFixed(1)}s ` +
    `(${(preguntasGoteo / segundosGoteo).toFixed(1)} por segundo).`,
);

/* --------------------------------------------- 7. el wifi de la universidad */

const DESDE_EL_WIFI = 130;
linea(
  `\n[${cronometro()}] 7. Wifi de la universidad: ${DESDE_EL_WIFI} cuentas desde la misma conexion...`,
);

const ipDelCampus = '190.85.10.77';
let creadasDesdeElWifi = 0;
let frenadasDesdeElWifi = 0;
let primeraFrenada = null;

for (let i = 0; i < DESDE_EL_WIFI; i++) {
  const r = await api('/auth/registro', {
    metodo: 'POST',
    ip: ipDelCampus,
    accion: 'registro desde el wifi del campus',
    cuerpo: {
      nombre: `Estudiante Campus ${i}`,
      email: correo('wifi', i),
      password: CLAVE,
      rol: 'ESTUDIANTE',
    },
  });
  if (r.estado === 201) creadasDesdeElWifi++;
  else if (r.estado === 429) {
    frenadasDesdeElWifi++;
    if (primeraFrenada === null) primeraFrenada = i + 1;
  }
}

linea(
  `   ${creadasDesdeElWifi} lograron crear cuenta, ${frenadasDesdeElWifi} quedaron frenadas` +
    `${primeraFrenada ? ` (la primera frenada fue la numero ${primeraFrenada})` : ''}.`,
);

/* ------------------------------------------------------------- 8. informe */

const segundosTotal = (performance.now() - arranqueTotal) / 1000;

let totalPeticiones = 0;
let totalBien = 0;
let totalMal = 0;
let totalFrenadas = 0;
let totalSinRespuesta = 0;
const filas = [];

for (const [accion, m] of medidas) {
  const ordenados = [...m.tiempos].sort((a, b) => a - b);
  const cuenta = ordenados.length;
  let bien = 0;
  let frenadas = 0;
  let sinRespuesta = 0;
  const otros = [];
  for (const [estado, veces] of m.estados) {
    if (estado >= 200 && estado < 300) bien += veces;
    else if (estado === 429) frenadas += veces;
    else if (estado === 0) sinRespuesta += veces;
    else otros.push(`${estado}x${veces}`);
  }
  totalPeticiones += cuenta;
  totalBien += bien;
  totalMal += cuenta - bien;
  totalFrenadas += frenadas;
  totalSinRespuesta += sinRespuesta;

  filas.push({
    accion,
    cuenta,
    bien,
    frenadas,
    sinRespuesta,
    otros: otros.join(' '),
    p50: redondear(percentil(ordenados, 50)),
    p95: redondear(percentil(ordenados, 95)),
    p99: redondear(percentil(ordenados, 99)),
    peor: redondear(ordenados[ordenados.length - 1]),
  });
}

filas.sort((a, b) => b.p95 - a.p95);

const ancho = Math.max(...filas.map((f) => f.accion.length), 10);
const col = (t, n) => String(t).padStart(n);

linea(`\n${'='.repeat(ancho + 54)}`);
linea('RESULTADO');
linea('='.repeat(ancho + 54));
linea(
  `${'accion'.padEnd(ancho)} ${col('veces', 7)} ${col('bien', 6)} ${col('medio', 7)} ${col('lento', 7)} ${col('peor', 7)}`,
);
linea(
  `${''.padEnd(ancho)} ${col('', 7)} ${col('', 6)} ${col('(mitad)', 7)} ${col('(95%)', 7)} ${col('', 7)}`,
);
linea('-'.repeat(ancho + 54));

for (const f of filas) {
  const problemas = [];
  if (f.frenadas) problemas.push(`${f.frenadas} frenadas`);
  if (f.sinRespuesta) problemas.push(`${f.sinRespuesta} sin respuesta`);
  if (f.otros) problemas.push(f.otros);
  linea(
    `${f.accion.padEnd(ancho)} ${col(f.cuenta, 7)} ${col(f.bien, 6)} ` +
      `${col(`${f.p50}ms`, 7)} ${col(`${f.p95}ms`, 7)} ${col(`${f.peor}ms`, 7)}` +
      `${problemas.length ? `   <- ${problemas.join(', ')}` : ''}`,
  );
}

linea('-'.repeat(ancho + 54));
linea(`Peticiones en total:      ${totalPeticiones}`);
linea(`Salieron bien:            ${totalBien} (${((totalBien / totalPeticiones) * 100).toFixed(1)}%)`);
linea(`No salieron bien:         ${totalMal}`);
linea(`  de esas, frenadas:      ${totalFrenadas} (el freno de la plataforma, a proposito)`);
linea(`  sin respuesta:          ${totalSinRespuesta}`);
if (causasSinRespuesta.size > 0) {
  linea('  por que se cayeron:');
  for (const [causa, veces] of causasSinRespuesta) linea(`    ${veces}x  ${causa}`);
}
linea(`Duracion de la prueba:    ${segundosTotal.toFixed(1)}s`);
linea(`Ritmo promedio:           ${(totalPeticiones / segundosTotal).toFixed(1)} peticiones por segundo`);
linea('='.repeat(ancho + 54));

const informe = {
  cuando: new Date().toISOString(),
  contra: BASE,
  usuarios: USUARIOS,
  simultaneos: SIMULTANEOS,
  segundos: Number(segundosTotal.toFixed(1)),
  totalPeticiones,
  totalBien,
  totalMal,
  totalFrenadas,
  totalSinRespuesta,
  registroPorSegundo: Number((estudiantes.length / segundosRegistro).toFixed(1)),
  entradaPorSegundo: Number((estudiantes.length / segundosEntrada).toFixed(1)),
  goteoPorSegundo: Number((preguntasGoteo / segundosGoteo).toFixed(1)),
  wifiDelCampus: { creadas: creadasDesdeElWifi, frenadas: frenadasDesdeElWifi, primeraFrenada },
  causasSinRespuesta: Object.fromEntries(causasSinRespuesta),
  acciones: filas,
};
const { writeFile } = await import('node:fs/promises');
await writeFile('pruebas/ultima-carga.json', `${JSON.stringify(informe, null, 2)}\n`, 'utf8');
linea('\nDetalle guardado en pruebas/ultima-carga.json');

/* ------------------------------------------------------------- 9. limpieza */

linea('\nBorrando lo que creo la prueba...');

const deEstaPrueba = { email: { endsWith: `-${SUF}@test.com` } };
await prisma.inmueble.deleteMany({ where: { arrendador: deEstaPrueba } });
const borradas = await prisma.usuario.deleteMany({ where: deEstaPrueba });
await prisma.$disconnect();

linea(`Listo: ${borradas.count} cuentas y sus inmuebles eliminados.\n`);

process.exit(0);
