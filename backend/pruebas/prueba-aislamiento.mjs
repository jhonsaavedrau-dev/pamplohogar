// Comprueba que la base de pruebas y la de internet estan de verdad separadas.
// Borra un inmueble en pruebas y verifica que en internet no cambia nada.
//   node pruebas/prueba-aislamiento.mjs
import { PrismaClient } from '@prisma/client';

const PRODUCCION = 'https://pamplohogar-api.onrender.com';
const prisma = new PrismaClient({ log: ['error'] });

let ok = 0;
let fallas = 0;

const revisar = (nombre, condicion, detalle = '') => {
  if (condicion) {
    console.log(`OK    ${nombre}${detalle ? ` -> ${detalle}` : ''}`);
    ok++;
  } else {
    console.log(`FALLA ${nombre}${detalle ? ` :: ${detalle}` : ''}`);
    fallas++;
  }
};

const contarEnProduccion = async () => {
  const r = await fetch(`${PRODUCCION}/api/inmuebles`);
  const d = await r.json();
  return d.total;
};

try {
  const baseLocal = await prisma.$queryRaw`SELECT current_database() AS nombre`;
  const nombreLocal = baseLocal[0].nombre;

  revisar(
    'la base local NO es la de internet',
    nombreLocal !== 'neondb',
    `local usa "${nombreLocal}", internet usa "neondb"`,
  );

  const antesLocal = await prisma.inmueble.count();
  const antesProd = await contarEnProduccion();
  revisar('ambas tienen datos', antesLocal > 0 && antesProd > 0, `local ${antesLocal}, internet ${antesProd}`);

  // Se guardan tambien las fotos: sin esto el inmueble volvia pelado y la
  // prueba decia "restaurado" sin serlo.
  const victima = await prisma.inmueble.findFirst({
    orderBy: { creadoEn: 'desc' },
    include: { fotos: true },
  });
  const { fotos, ...respaldo } = victima;
  await prisma.inmueble.delete({ where: { id: victima.id } });

  const despuesLocal = await prisma.inmueble.count();
  const despuesProd = await contarEnProduccion();

  revisar(
    'borrar en pruebas SI afecta a pruebas',
    despuesLocal === antesLocal - 1,
    `${antesLocal} a ${despuesLocal}`,
  );

  revisar(
    'borrar en pruebas NO afecta a internet',
    despuesProd === antesProd,
    `internet sigue en ${despuesProd}`,
  );

  const { id, creadoEn, actualizadoEn, ...campos } = respaldo;
  await prisma.inmueble.create({
    data: {
      ...campos,
      id,
      fotos: {
        create: fotos.map((f) => ({ url: f.url, publicId: f.publicId, orden: f.orden })),
      },
    },
  });

  const restaurado = await prisma.inmueble.count();
  const fotosRestauradas = await prisma.fotoInmueble.count({ where: { inmuebleId: id } });
  revisar('el inmueble de prueba se restauro', restaurado === antesLocal, `${restaurado} inmuebles`);
  revisar(
    'y volvio con sus fotos, no pelado',
    fotosRestauradas === fotos.length,
    `${fotosRestauradas} de ${fotos.length} fotos`,
  );
} finally {
  await prisma.$disconnect();
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
