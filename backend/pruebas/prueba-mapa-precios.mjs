// Verifica el mapa de precios por zona.
//   node pruebas/prueba-mapa-precios.mjs [direccion]
import { PrismaClient } from '@prisma/client';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = new PrismaClient({ log: ['error'] });

console.log(`Probando el mapa de precios contra ${BASE}\n`);

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
const BARRIO = `Zona Prueba ${suf}`;
const correoArrendador = `mapa-arr-${suf}@test.com`;

let tArr = '';

const publicar = async (precio, barrio = BARRIO, tipo = 'HABITACION') => {
  const r = await api('/inmuebles', {
    metodo: 'POST',
    token: tArr,
    cuerpo: {
      titulo: `Habitacion de prueba del mapa por ${precio}`,
      descripcion:
        'Publicacion creada solo para comprobar que el mapa de precios agrupa bien las zonas.',
      tipo,
      precio,
      barrio,
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
  exigir(r.estado === 201, `no se pudo publicar: estado ${r.estado}`);
  return r.datos.inmueble.id;
};

const mapa = async (tipo = 'HABITACION') => {
  const r = await api(`/inmuebles/mapa-de-precios?tipo=${tipo}`);
  exigir(r.estado === 200, `estado ${r.estado}`);
  return r.datos;
};

const zonaDe = (d, barrio) => d.zonas.find((z) => z.barrio === barrio);

try {
  const reg = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Arrendador Mapa',
      email: correoArrendador,
      password: 'clave12345',
      telefono: '3001112233',
      rol: 'ARRENDADOR',
    },
  });
  exigir(reg.datos?.token, `no se pudo registrar: estado ${reg.estado}`);
  tArr = reg.datos.token;

  await probar('el mapa se ve sin haber iniciado sesión', async () => {
    const d = await mapa();
    exigir(Array.isArray(d.zonas) && Array.isArray(d.puntos), 'faltan zonas o puntos');
    return 'es informacion publica, como el listado';
  });

  await probar('un tipo inventado no rompe nada', async () => {
    const r = await api('/inmuebles/mapa-de-precios?tipo=CASTILLO');
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.tipo === 'HABITACION', `devolvio ${r.datos.tipo}`);
    return 'cae en habitacion, que es lo que mas se busca';
  });

  await probar('sin decir el tipo muestra habitaciones', async () => {
    const r = await api('/inmuebles/mapa-de-precios');
    exigir(r.datos.tipo === 'HABITACION', `devolvio ${r.datos.tipo}`);
  });

  await probar('con dos publicaciones la zona todavía no se pinta', async () => {
    await publicar(300000);
    await publicar(320000);
    const d = await mapa();
    exigir(zonaDe(d, BARRIO) === undefined, 'pinto la zona con solo dos');
    exigir(d.barriosConPocosDatos.includes(BARRIO), 'no la conto entre las que faltan datos');
    return 'con dos, el color lo decidiria un solo arrendador';
  });

  await probar('las publicaciones sueltas sí aparecen como puntos', async () => {
    const d = await mapa();
    const mios = d.puntos.filter((p) => p.barrio === BARRIO);
    exigir(mios.length === 2, `salieron ${mios.length} puntos`);
    return 'un mapa vacio no le sirve a nadie mientras hay pocas publicaciones';
  });

  await probar('con tres publicaciones ya se pinta la zona', async () => {
    await publicar(340000);
    const d = await mapa();
    const z = zonaDe(d, BARRIO);
    exigir(z !== undefined, 'sigue sin pintarse');
    exigir(z.inmuebles === 3, `conto ${z.inmuebles}`);
    exigir(z.mediana === 320000, `mediana ${z.mediana}`);
    return `mediana ${z.mediana} sobre ${z.inmuebles} publicaciones`;
  });

  await probar('un precio absurdo no arrastra la zona', async () => {
    const id = await publicar(9000000);
    const d = await mapa();
    const z = zonaDe(d, BARRIO);
    // Con promedio serian mas de dos millones. Con mediana se queda en 330.000.
    exigir(z.mediana === 330000, `mediana ${z.mediana}`);
    await api(`/inmuebles/${id}`, { metodo: 'DELETE', token: tArr });
    return 'la mediana aguanta lo que el promedio no';
  });

  await probar('el centro de la zona cae donde están los inmuebles', async () => {
    const d = await mapa();
    const z = zonaDe(d, BARRIO);
    exigir(Math.abs(z.lat - 7.372) < 0.001, `lat ${z.lat}`);
    exigir(Math.abs(z.lng - -72.653) < 0.001, `lng ${z.lng}`);
  });

  await probar('los tipos no se mezclan entre sí', async () => {
    const d = await mapa('CASA');
    exigir(zonaDe(d, BARRIO) === undefined, 'la zona de habitaciones salio en casas');
    exigir(!d.puntos.some((p) => p.barrio === BARRIO), 'los puntos se colaron');
    return 'una habitacion y una casa no compiten por el mismo estudiante';
  });

  await probar('un inmueble oculto sale del mapa', async () => {
    const id = await publicar(300000);
    const antes = (await mapa()).puntos.length;
    await api(`/inmuebles/${id}`, { metodo: 'PATCH', token: tArr, cuerpo: { activo: false } });
    const despues = (await mapa()).puntos.length;
    exigir(despues === antes - 1, `paso de ${antes} a ${despues}`);
  });

  await probar('el barrio escrito distinto cuenta en la misma zona', async () => {
    await publicar(310000, BARRIO.toUpperCase());
    const d = await mapa();
    const iguales = d.zonas.filter((z) => z.barrio.toUpperCase() === BARRIO.toUpperCase());
    exigir(iguales.length === 1, `salieron ${iguales.length} zonas para el mismo barrio`);
    exigir(iguales[0].inmuebles === 4, `conto ${iguales[0].inmuebles}`);
    return 'mayusculas y acentos no parten la zona en dos';
  });

  await probar('el nivel de cada zona compara contra toda la ciudad', async () => {
    const d = await mapa();
    for (const z of d.zonas) {
      const esperado =
        z.mediana > d.medianaDeLaCiudad * 1.1
          ? 'caro'
          : z.mediana < d.medianaDeLaCiudad * 0.9
            ? 'barato'
            : 'normal';
      exigir(z.nivel === esperado, `${z.barrio}: ${z.nivel} pero deberia ser ${esperado}`);
    }
    return `${d.zonas.length} zonas revisadas contra ${d.medianaDeLaCiudad}`;
  });
} finally {
  await prisma.inmueble.deleteMany({ where: { arrendador: { email: correoArrendador } } });
  await prisma.usuario.deleteMany({ where: { email: correoArrendador } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
