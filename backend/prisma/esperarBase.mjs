import { PrismaClient } from '@prisma/client';

/**
 * Despierta la base de datos antes de migrar.
 *
 * El plan gratuito de Neon suspende el servidor cuando nadie lo usa. Al
 * desplegar, "prisma migrate deploy" se conecta, la base todavia esta
 * despertando, y el bloqueo que Prisma pide se rinde a los 10 segundos.
 * El despliegue falla aunque no haya nada malo.
 *
 * Aqui insistimos con una consulta trivial hasta que responda, y solo
 * entonces dejamos que corran las migraciones.
 */

const INTENTOS = 12;
const ESPERA_MS = 5000;

// Se despierta la conexion directa a proposito: es la que usan las migraciones.
const prisma = new PrismaClient({
  log: ['error'],
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let despierta = false;

for (let intento = 1; intento <= INTENTOS; intento++) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    process.stdout.write(`Base de datos despierta en el intento ${intento}.\n`);
    despierta = true;
    break;
  } catch (error) {
    const texto = error instanceof Error ? error.message : String(error);
    // Prisma abre el error con una linea de contexto que termina en dos puntos
    // y no dice nada util. La que interesa es la siguiente.
    const lineas = texto
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);
    const detalle = lineas.find((linea) => !linea.endsWith(':')) ?? lineas[0] ?? 'sin detalle';
    const quedanIntentos = intento < INTENTOS;
    process.stdout.write(
      `Intento ${intento} de ${INTENTOS}: la base todavia no responde. ${detalle}` +
        (quedanIntentos ? ` Reintento en ${ESPERA_MS / 1000}s.\n` : '\n'),
    );
    if (quedanIntentos) await dormir(ESPERA_MS);
  }
}

await prisma.$disconnect();

if (!despierta) {
  process.stderr.write(
    `\nLa base de datos no respondio despues de ${(INTENTOS * ESPERA_MS) / 1000} segundos.\n` +
      'Revisa que el proyecto de Neon siga activo y que DIRECT_URL sea correcta.\n',
  );
  process.exit(1);
}
