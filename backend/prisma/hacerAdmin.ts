import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Convierte una cuenta existente en administrador.
 * A proposito no se puede hacer desde la pagina: el rol de administrador
 * solo se otorga desde este computador, con acceso al proyecto.
 *
 *   npm run hacer-admin -- correo@ejemplo.com
 */
async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    process.stderr.write(
      'Falta el correo.\n\n  Uso:  npm run hacer-admin -- tucorreo@ejemplo.com\n\n',
    );
    process.exitCode = 1;
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    process.stderr.write(
      `No existe ninguna cuenta con el correo ${email}.\n` +
        'Registrate primero en la página y después vuelve a correr este comando.\n\n',
    );
    process.exitCode = 1;
    return;
  }

  if (usuario.rol === 'ADMIN') {
    process.stdout.write(`${usuario.nombre} ya era administrador. No habia nada que cambiar.\n\n`);
    return;
  }

  await prisma.usuario.update({ where: { email }, data: { rol: 'ADMIN' } });

  process.stdout.write(
    `Listo. ${usuario.nombre} (${email}) ahora es administrador.\n` +
      'Cierra sesión y vuelve a entrar en la página para que tome efecto.\n\n',
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Fallo: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
