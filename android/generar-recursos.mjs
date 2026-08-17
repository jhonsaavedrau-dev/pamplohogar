/*
  Genera los dibujos que la app de Android necesita y que Bubblewrap no dejo
  hechos: la pantalla de arranque y el icono recortable.

  Bubblewrap deberia generarlos al correr `bubblewrap init`, pero en Windows el
  proceso se queda esperando respuestas por teclado y si se corta a la mitad
  deja el proyecto sin esos archivos. La compilacion falla mucho despues, con
  un error que solo dice "resource drawable/splash not found" y no explica de
  donde salia ese dibujo.

  Todo sale de frontend/public/marca.svg, la misma casa de la pagina.

  Como correrlo, desde la carpeta android:

    npm install --no-save sharp
    node generar-recursos.mjs
*/

import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const proyecto = join(aqui, '..');
const RES = join(aqui, 'app', 'src', 'main', 'res');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  process.stderr.write(
    'Falta la herramienta de imagenes. Desde esta carpeta:\n\n' +
      '  npm install --no-save sharp\n\n',
  );
  process.exit(1);
}

const marca = await readFile(join(proyecto, 'frontend', 'public', 'marca.svg'), 'utf8');

// El crema de la marca. Un fondo transparente se ve sucio sobre el cajon de
// aplicaciones de Android, que es blanco.
const CREMA = '#FFF7F0';

/**
 * Dibuja la casa centrada sobre el fondo crema.
 *
 * @param {number} lado Tamano final en pixeles.
 * @param {number} proporcion Cuanto del cuadro ocupa la casa, de 0 a 1.
 * @param {string} destino Donde se guarda.
 */
async function dibujar(lado, proporcion, destino) {
  const casa = await sharp(Buffer.from(marca))
    .resize(Math.round(lado * proporcion), Math.round(lado * proporcion))
    .png()
    .toBuffer();

  await sharp({ create: { width: lado, height: lado, channels: 4, background: CREMA } })
    .composite([{ input: casa, gravity: 'center' }])
    .png()
    .toFile(destino);
}

// La pantalla de arranque. La casa a la mitad del cuadro: se ve un instante y
// no compite con nada.
const ARRANQUE = [
  ['drawable', 320],
  ['drawable-mdpi', 320],
  ['drawable-hdpi', 480],
  ['drawable-xhdpi', 640],
  ['drawable-xxhdpi', 960],
  ['drawable-xxxhdpi', 1280],
];

// El icono de la aplicacion. Android lo recorta con la forma que use cada
// telefono, circulo, cuadrado redondeado o gota, y solo garantiza que se vea
// el 80% del centro: por eso la casa va al 60% y el fondo llega hasta el borde.
// Con la casa mas grande, en los telefonos redondos se corta el techo.
const ICONO = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

for (const [carpeta, lado] of ARRANQUE) {
  await mkdir(join(RES, carpeta), { recursive: true });
  await dibujar(lado, 0.5, join(RES, carpeta, 'splash.png'));
  process.stdout.write(`${carpeta}/splash.png (${lado}x${lado})\n`);
}

for (const [carpeta, lado] of ICONO) {
  await mkdir(join(RES, carpeta), { recursive: true });
  await dibujar(lado, 0.6, join(RES, carpeta, 'ic_maskable.png'));
  process.stdout.write(`${carpeta}/ic_maskable.png (${lado}x${lado})\n`);
}

process.stdout.write('\nListo. Ahora se puede compilar con bubblewrap build.\n');
