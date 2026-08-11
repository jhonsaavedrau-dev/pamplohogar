import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Borra las cuentas que dejan las pruebas automaticas.
 *
 * Por defecto solo muestra lo que borraria. Para que borre de verdad hay que
 * pasarle --confirmar, porque esto arrastra tambien los inmuebles, favoritos
 * y resenas de esas cuentas.
 *
 *   npm run limpiar-pruebas
 *   npm run limpiar-pruebas -- --confirmar
 */

const CORREOS_DE_PRUEBA = {
  OR: [
    { email: { endsWith: '@test.com' } },
    { email: { equals: 'admin.prueba@pamplohogar.com' } },
  ],
};

async function main(): Promise<void> {
  const confirmar = process.argv.includes('--confirmar');

  const cuentas = await prisma.usuario.findMany({
    where: CORREOS_DE_PRUEBA,
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      _count: { select: { inmuebles: true, resenasEscritas: true, favoritos: true } },
    },
    orderBy: { creadoEn: 'asc' },
  });

  if (cuentas.length === 0) {
    process.stdout.write('No hay cuentas de prueba. Todo limpio.\n\n');
    return;
  }

  const totalInmuebles = cuentas.reduce((suma, c) => suma + c._count.inmuebles, 0);

  process.stdout.write(`\nCuentas de prueba encontradas: ${cuentas.length}\n\n`);
  for (const c of cuentas) {
    const extras = c._count.inmuebles > 0 ? `  (${c._count.inmuebles} inmuebles)` : '';
    process.stdout.write(`  ${c.email}${extras}\n`);
  }
  process.stdout.write(`\nArrastraria ${totalInmuebles} inmuebles publicados por ellas.\n`);

  if (!confirmar) {
    process.stdout.write(
      '\nNo se borro nada. Para borrar de verdad:\n' +
        '  npm run limpiar-pruebas -- --confirmar\n\n',
    );
    return;
  }

  const { count } = await prisma.usuario.deleteMany({ where: CORREOS_DE_PRUEBA });
  process.stdout.write(`\nListo. Se eliminaron ${count} cuentas de prueba.\n\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Fallo: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
