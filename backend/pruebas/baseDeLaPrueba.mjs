import { PrismaClient } from '@prisma/client';

/*
  Evita que una prueba ensucie la base de internet.

  Casi todas las pruebas se conectan a la base para limpiar lo que crean. Esa
  conexion sale del `.env`, que apunta a la base del computador. Si se apunta
  la prueba al servidor de internet pasandole la direccion, las cuentas se
  crean alla pero la limpieza borra aca: quedan cuentas de prueba regadas en
  la plataforma de verdad, y encima las comprobaciones que miran la base fallan
  sin motivo aparente.

  Paso de verdad el 12 de agosto de 2026 y dejo cinco cuentas y dos inmuebles
  falsos en produccion.

  Asi que si la prueba apunta a algo que no sea este computador, se para y lo
  explica, a menos que se le diga a proposito con que base limpiar.
*/

const esDeEsteComputador = (direccion) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(direccion);

/**
 * La conexion que debe usar la prueba para limpiar lo que crea.
 *
 * @param {string} direccion A que servidor le esta hablando la prueba.
 */
export function baseDeLaPrueba(direccion) {
  const indicada = process.env.URL_BASE_DE_LA_PRUEBA;

  if (!esDeEsteComputador(direccion) && !indicada) {
    console.error(
      `\nEsta prueba crea cuentas y despues las borra usando la base de datos.\n` +
        `Le estas apuntando a ${direccion}, que no es este computador, pero la\n` +
        `limpieza saldria por la base local: quedarian cuentas de prueba regadas\n` +
        `en la plataforma de verdad.\n\n` +
        `Si de verdad quieres probar contra ese servidor, dile con que base\n` +
        `limpiar:\n\n` +
        `  URL_BASE_DE_LA_PRUEBA="<direccion de esa base>" node pruebas/<archivo>.mjs ${direccion}\n`,
    );
    process.exit(1);
  }

  return new PrismaClient({
    log: ['error'],
    ...(indicada ? { datasources: { db: { url: indicada } } } : {}),
  });
}
