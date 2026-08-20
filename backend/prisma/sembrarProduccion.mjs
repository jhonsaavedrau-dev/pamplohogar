/*
  Carga los datos de ejemplo en la base de datos de internet.

  La semilla normal (`npm run seed`) trabaja contra la base de pruebas, que es
  la que esta configurada en .env. Esta corre exactamente la misma semilla pero
  apuntando a la base de verdad, la que lee pamplohogar.com.

  Va aparte y no como una bandera de la otra a proposito: escribir en la base de
  internet tiene que costar un comando distinto y escrito a mano. Una bandera
  que se olvida puesta es un accidente esperando.

  LA DIRECCION NO SE GUARDA EN EL PROYECTO. Se lee de backend/.env.produccion,
  que .gitignore ignora y que se borra apenas se termina. Es la llave de la base
  de datos: quien la tenga puede leerlo y borrarlo todo.

  QUE BORRA LA SEMILLA, para que quede escrito:
    - las cuentas @ejemplo.com y todo lo que cuelga de ellas
    - las cuentas @test.com que dejan las pruebas de la API
  Ninguna cuenta ni publicacion de una persona real se toca.

  Uso:  npm run seed:produccion
*/
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const RUTA = join(aqui, '..', '.env.produccion');

if (!existsSync(RUTA)) {
  process.stderr.write(
    'Falta el archivo backend/.env.produccion con la direccion de la base de internet.\n',
  );
  process.exit(1);
}

/** Saca un valor del archivo, con o sin comillas alrededor. */
function leer(contenido, clave) {
  const linea = contenido
    .split(/\r?\n/)
    .find((l) => !l.trimStart().startsWith('#') && l.trimStart().startsWith(`${clave}=`));
  if (!linea) return '';
  return linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

const contenido = readFileSync(RUTA, 'utf8');
const url = leer(contenido, 'DATABASE_URL');

if (!url || url.includes('PEGA-AQUI')) {
  process.stderr.write(
    'El archivo backend/.env.produccion todavia no tiene la direccion.\n' +
      'Abrelo, reemplaza PEGA-AQUI por lo que copiaste de Render y guarda.\n',
  );
  process.exit(1);
}

if (!url.startsWith('postgresql://')) {
  process.stderr.write(
    'Lo que hay en backend/.env.produccion no parece una direccion de base de datos:\n' +
      'tiene que empezar por postgresql://\n',
  );
  process.exit(1);
}

// Si alguien pega la de pruebas por equivocacion, este comando no tendria
// sentido y ademas haria creer que ya se cargo lo de internet.
const rutaPruebas = join(aqui, '..', '.env');
if (existsSync(rutaPruebas) && leer(readFileSync(rutaPruebas, 'utf8'), 'DATABASE_URL') === url) {
  process.stderr.write(
    'Esa es la direccion de la base de PRUEBAS, la misma de .env.\n' +
      'Para esa base ya existe `npm run seed`.\n',
  );
  process.exit(1);
}

// La conexion directa solo la usan las migraciones, pero Prisma exige que la
// variable exista. Si no viene escrita aparte, sirve la misma.
const directa = leer(contenido, 'DIRECT_URL');
const DIRECT_URL = directa && !directa.includes('PEGA-AQUI') ? directa : url;

const servidor = url.match(/@([^/?]+)/)?.[1] ?? '(desconocido)';
process.stdout.write(`Sembrando la base de INTERNET (${servidor})...\n\n`);

const resultado = spawnSync('npx', ['tsx', join(aqui, 'seed.ts')], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL },
});

process.exit(resultado.status ?? 1);
