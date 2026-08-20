/*
  Cuenta lo que hay en cada base de datos y lo pone al lado de lo que responde
  la API publicada.

  Sirve para responder una sola pregunta, que ya nos costo dos vueltas: cuando
  los ejemplos no aparecen en pamplohogar.com, es porque la base no los tiene o
  porque la API esta mirando otra base.

  Uso:  node prisma/contarBases.mjs
*/
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));

function leerUrl(archivo) {
  const ruta = join(aqui, '..', archivo);
  if (!existsSync(ruta)) return null;
  const linea = readFileSync(ruta, 'utf8')
    .split(/\r?\n/)
    .find((l) => !l.trimStart().startsWith('#') && l.trimStart().startsWith('DATABASE_URL='));
  if (!linea) return null;
  const valor = linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor && !valor.includes('PEGA-AQUI') ? valor : null;
}

/** Solo el servidor y el nombre de la base: nunca la contrasena. */
const sinClave = (url) => {
  const m = url.match(/@([^?]+)/);
  return m ? m[1] : '(no reconozco el formato)';
};

async function contar(nombre, url) {
  if (!url) {
    process.stdout.write(`${nombre}: no hay direccion configurada\n\n`);
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const [inmuebles, barrios, resenas, usuarios] = await Promise.all([
      prisma.inmueble.count(),
      prisma.resenaBarrio.count(),
      prisma.resena.count(),
      prisma.usuario.count(),
    ]);
    process.stdout.write(
      `${nombre}\n` +
        `  servidor:   ${sinClave(url)}\n` +
        `  inmuebles:  ${inmuebles}\n` +
        `  opiniones de barrio: ${barrios}\n` +
        `  resenas de arrendador: ${resenas}\n` +
        `  usuarios:   ${usuarios}\n\n`,
    );
  } catch (error) {
    process.stdout.write(`${nombre}: no pude conectarme. ${error.message.split('\n')[0]}\n\n`);
  } finally {
    await prisma.$disconnect();
  }
}

const dev = leerUrl('.env');
const prod = leerUrl('.env.produccion');

await contar('BASE DE PRUEBAS (.env)', dev);
await contar('BASE DE INTERNET (.env.produccion)', prod);

if (dev && prod) {
  process.stdout.write(`Son la misma direccion: ${dev === prod ? 'SI' : 'no'}\n`);
  process.stdout.write(`Apuntan al mismo servidor y base: ${sinClave(dev) === sinClave(prod) ? 'SI' : 'no'}\n\n`);
}

try {
  const r = await fetch('https://api.pamplohogar.com/api/inmuebles?pagina=1').then((x) => x.json());
  process.stdout.write(`LA API PUBLICADA responde: ${r.total} inmuebles\n`);
} catch {
  process.stdout.write('LA API PUBLICADA: no respondio (puede estar despertando)\n');
}
