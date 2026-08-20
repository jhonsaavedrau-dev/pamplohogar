/*
  Corre un programa contra la base de datos de INTERNET, la que lee
  pamplohogar.com.

  Los programas normales (`npm run seed`, por ejemplo) trabajan contra la base
  de pruebas, que es la que esta configurada en .env. Este los corre igual pero
  apuntando a la de verdad.

  Va aparte y no como una bandera de los otros a proposito: escribir en la base
  de internet tiene que costar un comando distinto y escrito a mano. Una
  bandera que se olvida puesta es un accidente esperando.

  LA DIRECCION NO SE GUARDA EN EL PROYECTO. Se lee de backend/.env.produccion,
  que .gitignore ignora y que se borra apenas se termina. Es la llave de la base
  de datos: quien la tenga puede leerlo y borrarlo todo.

  QUE BORRA LA SEMILLA, para que quede escrito:
    - las cuentas @ejemplo.com y todo lo que cuelga de ellas
    - las cuentas @test.com que dejan las pruebas de la API
  Ninguna cuenta ni publicacion de una persona real se toca.

  Uso:  node prisma/correrEnProduccion.mjs prisma/loQueSea.ts

  Con nombre propio, que es como se usa:
    npm run ejemplos:produccion   agrega lo que falte, sin borrar nada
    npm run seed:produccion       borra los ejemplos y los vuelve a crear
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

const programa = process.argv[2] ?? 'prisma/seed.ts';

const resultado = spawnSync('npx', ['tsx', programa], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL },
});

process.exit(resultado.status ?? 1);
