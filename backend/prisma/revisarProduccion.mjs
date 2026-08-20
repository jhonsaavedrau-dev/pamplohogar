/*
  Mira que hay en la base de internet ANTES de sembrarla, y sobre todo cuanto de
  eso es de gente de verdad.

  La semilla borra las cuentas @ejemplo.com y @test.com con todo lo que cuelga
  de ellas. Eso esta bien mientras lo demas sea de verdad y se quede quieto,
  pero conviene mirarlo con los ojos antes y no confiar en que asi sea.

  No imprime nombres, correos ni telefonos: solo cuentas. Lo que hace falta
  para decidir, y nada mas.

  Uso:  node prisma/revisarProduccion.mjs
*/
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const ruta = join(aqui, '..', '.env.produccion');

if (!existsSync(ruta)) {
  process.stderr.write('Falta backend/.env.produccion\n');
  process.exit(1);
}

const linea = readFileSync(ruta, 'utf8')
  .split(/\r?\n/)
  .find((l) => !l.trimStart().startsWith('#') && l.trimStart().startsWith('DATABASE_URL='));
const url = linea?.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');

if (!url || url.includes('PEGA-AQUI')) {
  process.stderr.write('backend/.env.produccion todavia no tiene la direccion\n');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

const DE_EJEMPLO = { OR: [{ email: { endsWith: '@ejemplo.com' } }, { email: { endsWith: '@test.com' } }] };
const DE_VERDAD = { AND: [{ email: { not: { endsWith: '@ejemplo.com' } } }, { email: { not: { endsWith: '@test.com' } } }] };

const [ejemplo, verdad] = await Promise.all([
  prisma.usuario.count({ where: DE_EJEMPLO }),
  prisma.usuario.count({ where: DE_VERDAD }),
]);

const [inmEjemplo, inmVerdad] = await Promise.all([
  prisma.inmueble.count({ where: { arrendador: DE_EJEMPLO } }),
  prisma.inmueble.count({ where: { arrendador: DE_VERDAD } }),
]);

const [barrioEjemplo, barrioVerdad] = await Promise.all([
  prisma.resenaBarrio.count({ where: { autor: DE_EJEMPLO } }),
  prisma.resenaBarrio.count({ where: { autor: DE_VERDAD } }),
]);

const [resEjemplo, resVerdad] = await Promise.all([
  prisma.resena.count({ where: { autor: DE_EJEMPLO } }),
  prisma.resena.count({ where: { autor: DE_VERDAD } }),
]);

const [mensajes, favoritos] = await Promise.all([
  prisma.mensaje.count(),
  prisma.favorito?.count?.() ?? Promise.resolve(null),
]);

/*
  Lo que de verdad se pierde.

  Las cuentas de verdad no se tocan, pero lo que ELLAS escribieron sobre una
  cuenta de ejemplo si se va con ella: un estudiante real que le escribio a un
  arrendador de mentiras, o que guardo en favoritos un inmueble de ejemplo.
  Eso no es dano nuevo -- esas conversaciones nunca iban a llegar a ninguna
  parte -- pero hay que decirlo antes y no despues.
*/
const conversaciones = await prisma.conversacion.findMany({
  select: { estudiante: { select: { email: true } }, arrendador: { select: { email: true } } },
});
const deMentiras = (correo) => correo.endsWith('@ejemplo.com') || correo.endsWith('@test.com');
const conversacionesQueSeVan = conversaciones.filter(
  (c) =>
    (deMentiras(c.arrendador.email) && !deMentiras(c.estudiante.email)) ||
    (deMentiras(c.estudiante.email) && !deMentiras(c.arrendador.email)),
).length;

const favoritosQueSeVan = await prisma.favorito.count({
  where: { inmueble: { arrendador: DE_EJEMPLO }, usuario: DE_VERDAD },
});

const fila = (que, a, b) =>
  `  ${que.padEnd(24)} ${String(a).padStart(4)}  ${String(b).padStart(4)}\n`;

process.stdout.write(
  '\nBASE DE INTERNET, antes de sembrar\n\n' +
    '                           de ejemplo   de verdad\n' +
    fila('cuentas', ejemplo, verdad) +
    fila('inmuebles', inmEjemplo, inmVerdad) +
    fila('opiniones de barrio', barrioEjemplo, barrioVerdad) +
    fila('resenas de arrendador', resEjemplo, resVerdad) +
    `\n  mensajes en total:       ${mensajes}\n` +
    (favoritos === null ? '' : `  favoritos en total:      ${favoritos}\n`) +
    '\nLa semilla borra SOLO la columna de la izquierda.\n' +
    '\nDe gente de verdad se perderia:\n' +
    `  conversaciones con una cuenta de ejemplo: ${conversacionesQueSeVan}\n` +
    `  favoritos sobre un inmueble de ejemplo:   ${favoritosQueSeVan}\n`,
);

await prisma.$disconnect();
