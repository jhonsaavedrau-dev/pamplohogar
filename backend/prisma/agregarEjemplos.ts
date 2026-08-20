import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { claveDeBarrio } from '../src/lib/barrios.js';
import { ARRENDADORES, ESTUDIANTES, RESENAS, RESENAS_DE_BARRIO } from './datosDeEjemplo.js';

/*
  Agrega los ejemplos que falten. NO BORRA NADA.

  POR QUE EXISTE, aparte de la semilla completa. La semilla borra las cuentas
  de ejemplo y las vuelve a crear, y eso esta bien en una base de pruebas. En la
  base de internet ya hay gente de verdad: estudiantes que se registraron,
  arrendadores que publicaron, conversaciones abiertas. Borrar una cuenta de
  ejemplo se lleva por delante las conversaciones que una persona de verdad le
  escribio y los favoritos que guardo sobre esas publicaciones. Eso no se
  recupera.

  Este programa solo suma. Si una opinion ya existe, la deja; si un estudiante
  de ejemplo ya esta creado, lo reutiliza. Se puede correr las veces que haga
  falta y el resultado es el mismo.

  NO TOCA LOS BARRIOS DONDE HAY ALGO DE VERDAD. Si en un barrio publico un
  arrendador real, ahi no entra ninguna opinion de mentiras: serian comentarios
  falsos sobre la casa de una persona, y quien los lea va a creer que son de
  alguien que vivio ahi.

  Uso:  npm run ejemplos:produccion
*/

const prisma = new PrismaClient();

const esDeEjemplo = (email: string) =>
  email.endsWith('@ejemplo.com') || email.endsWith('@test.com');

const MINIMO_PARA_PROMEDIO = 3;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('pamplona2026', 10);

  // ------------------------------------------------------- las cuentas
  process.stdout.write('Revisando las cuentas de ejemplo...\n');

  const arrendadores = await Promise.all(
    ARRENDADORES.map((datos) =>
      prisma.usuario.upsert({
        where: { email: datos.email },
        update: {},
        create: { ...datos, passwordHash, rol: 'ARRENDADOR' },
      }),
    ),
  );

  const estudiantes = await Promise.all(
    ESTUDIANTES.map((datos) =>
      prisma.usuario.upsert({
        where: { email: datos.email },
        update: {},
        create: { ...datos, passwordHash, rol: 'ESTUDIANTE' },
      }),
    ),
  );

  // --------------------------------------------- que barrios son de verdad
  const inmuebles = await prisma.inmueble.findMany({
    select: { barrio: true, arrendador: { select: { email: true } } },
  });

  const barriosConAlgoReal = new Set(
    inmuebles.filter((i) => !esDeEjemplo(i.arrendador.email)).map((i) => claveDeBarrio(i.barrio)),
  );

  // -------------------------------------------------- opiniones de barrio
  process.stdout.write('Completando las opiniones de barrio...\n');

  let opinionesNuevas = 0;
  let barriosRespetados = 0;

  // Agrupadas por barrio para poder contar cuantas faltan en cada uno.
  const porBarrio = new Map<string, typeof RESENAS_DE_BARRIO>();
  for (const opinion of RESENAS_DE_BARRIO) {
    const lista = porBarrio.get(opinion.barrio) ?? [];
    lista.push(opinion);
    porBarrio.set(opinion.barrio, lista);
  }

  for (const [barrio, opiniones] of porBarrio) {
    const clave = claveDeBarrio(barrio);

    if (barriosConAlgoReal.has(clave)) {
      process.stdout.write(`  ${barrio}: hay algo publicado de verdad, no le pongo ejemplos\n`);
      barriosRespetados += 1;
      continue;
    }

    const yaHay = await prisma.resenaBarrio.count({ where: { clave } });
    if (yaHay >= MINIMO_PARA_PROMEDIO) continue;

    for (const opinion of opiniones) {
      const autorId = estudiantes[opinion.indiceEstudiante].id;

      // La base impide dos opiniones de la misma persona sobre el mismo
      // barrio, asi que si ya estaba no pasa nada y se sigue.
      const existe = await prisma.resenaBarrio.findFirst({ where: { autorId, clave } });
      if (existe) continue;

      await prisma.resenaBarrio.create({
        data: {
          autorId,
          barrio: opinion.barrio,
          clave,
          tranquilidad: opinion.tranquilidad,
          seguridad: opinion.seguridad,
          transporte: opinion.transporte,
          comentario: opinion.comentario,
        },
      });
      opinionesNuevas += 1;
    }
  }

  // ------------------------------------------------ resenas de arrendador
  process.stdout.write('Completando las reseñas de los arrendadores...\n');

  let resenasNuevas = 0;
  for (const resena of RESENAS) {
    const autorId = estudiantes[resena.indiceEstudiante].id;
    const arrendadorId = arrendadores[resena.indiceArrendador].id;

    const existe = await prisma.resena.findFirst({ where: { autorId, arrendadorId } });
    if (existe) continue;

    const primerInmueble = await prisma.inmueble.findFirst({
      where: { arrendadorId },
      orderBy: { creadoEn: 'asc' },
    });

    await prisma.resena.create({
      data: {
        autorId,
        arrendadorId,
        inmuebleId: primerInmueble?.id ?? null,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
      },
    });
    resenasNuevas += 1;
  }

  // ------------------------------------------------------------- resumen
  const totales = {
    opiniones: await prisma.resenaBarrio.count(),
    resenas: await prisma.resena.count(),
    inmuebles: await prisma.inmueble.count(),
  };

  process.stdout.write(
    `\nListo, sin borrar nada.\n` +
      `  opiniones de barrio nuevas: ${opinionesNuevas}\n` +
      `  reseñas de arrendador nuevas: ${resenasNuevas}\n` +
      `  barrios que dejé en paz por tener algo de verdad: ${barriosRespetados}\n\n` +
      `Ahora la base tiene ${totales.inmuebles} inmuebles, ` +
      `${totales.opiniones} opiniones de barrio y ${totales.resenas} reseñas.\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Fallo al agregar los ejemplos: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
