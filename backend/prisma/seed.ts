import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { claveDeBarrio } from '../src/lib/barrios.js';
import {
  ARRENDADORES,
  ESTUDIANTES,
  HISTORIALES,
  INMUEBLES,
  RESENAS,
  RESENAS_DE_BARRIO,
  foto,
} from './datosDeEjemplo.js';

const prisma = new PrismaClient();

const haceDias = (dias: number): Date => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

/**
 * Hace cuantos dias se publico cada inmueble, contando en el mismo orden en que
 * aparecen arriba. Se reparten a proposito: si todos fueran de hoy, la insignia
 * de recien publicado saldria en los diez y dejaria de significar algo.
 */
const DIAS_DESDE_PUBLICACION = [3, 42, 96, 18, 11, 27, 63, 6, 130, 61, 34, 8, 15, 9, 75, 150, 52, 20, 88, 4, 47];

async function main(): Promise<void> {
  process.stdout.write('Limpiando datos anteriores de la semilla...\n');

  const correos = [...ARRENDADORES, ...ESTUDIANTES].map((u) => u.email);
  await prisma.usuario.deleteMany({ where: { email: { in: correos } } });

  // Las cuentas que crean las pruebas de la API terminan en @test.com y no aportan nada.
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@test.com' } } });

  const passwordHash = await bcrypt.hash('pamplona2026', 10);

  process.stdout.write('Creando arrendadores y estudiantes de ejemplo...\n');

  const arrendadores = await Promise.all(
    ARRENDADORES.map((datos) =>
      prisma.usuario.create({
        data: { ...datos, passwordHash, rol: 'ARRENDADOR' },
      }),
    ),
  );

  const estudiantes = await Promise.all(
    ESTUDIANTES.map((datos) =>
      prisma.usuario.create({
        data: { ...datos, passwordHash, rol: 'ESTUDIANTE' },
      }),
    ),
  );

  process.stdout.write('Creando inmuebles...\n');

  let total = 0;
  const creados: string[][] = [];

  for (const [indice, grupo] of INMUEBLES.entries()) {
    const arrendador = arrendadores[indice];
    const idsDelGrupo: string[] = [];

    for (const semilla of grupo) {
      const { fotos, ...campos } = semilla;
      const inmueble = await prisma.inmueble.create({
        data: {
          ...campos,
          arrendadorId: arrendador.id,
          creadoEn: haceDias(DIAS_DESDE_PUBLICACION[total] ?? 90),
          fotos: {
            create: fotos.map((id, orden) => ({
              url: foto(id),
              publicId: `semilla/${id}`,
              orden,
            })),
          },
        },
      });
      idsDelGrupo.push(inmueble.id);
      total += 1;
    }

    creados.push(idsDelGrupo);
  }

  process.stdout.write('Creando historial de precios...\n');

  let totalCambios = 0;
  for (const historial of HISTORIALES) {
    const inmuebleId = creados[historial.indiceArrendador]?.[historial.indiceInmueble];
    if (!inmuebleId) continue;

    for (const cambio of historial.cambios) {
      await prisma.cambioDePrecio.create({
        data: {
          inmuebleId,
          precioAnterior: cambio.anterior,
          precioNuevo: cambio.nuevo,
          creadoEn: haceDias(cambio.hace),
        },
      });
      totalCambios += 1;
    }
  }

  process.stdout.write('Creando reseñas...\n');

  for (const resena of RESENAS) {
    const arrendador = arrendadores[resena.indiceArrendador];
    const primerInmueble = await prisma.inmueble.findFirst({
      where: { arrendadorId: arrendador.id },
      orderBy: { creadoEn: 'asc' },
    });

    await prisma.resena.create({
      data: {
        autorId: estudiantes[resena.indiceEstudiante].id,
        arrendadorId: arrendador.id,
        inmuebleId: primerInmueble?.id ?? null,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
      },
    });
  }

  process.stdout.write('Creando opiniones de barrio...\n');

  for (const opinion of RESENAS_DE_BARRIO) {
    await prisma.resenaBarrio.create({
      data: {
        autorId: estudiantes[opinion.indiceEstudiante].id,
        barrio: opinion.barrio,
        clave: claveDeBarrio(opinion.barrio),
        tranquilidad: opinion.tranquilidad,
        seguridad: opinion.seguridad,
        transporte: opinion.transporte,
        comentario: opinion.comentario,
      },
    });
  }

  process.stdout.write(
    `\nListo. ${total} inmuebles, ${arrendadores.length} arrendadores, ${estudiantes.length} estudiantes, ` +
      `${RESENAS.length} reseñas, ${RESENAS_DE_BARRIO.length} opiniones de barrio ` +
      `y ${totalCambios} cambios de precio.\n` +
      `Cuentas de prueba (todas con la contraseña pamplona2026):\n` +
      `  Arrendador: ${ARRENDADORES[0].email}\n` +
      `  Estudiante: ${ESTUDIANTES[0].email}\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Fallo la semilla: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
