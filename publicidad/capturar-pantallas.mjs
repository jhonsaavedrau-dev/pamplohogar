/*
  Capturas de pamplohogar.com como esta ahora mismo, en computador y en celular.

  Se usa el Chrome que ya descargo Remotion, para no bajar otro navegador de
  200 megas solo para esto.

  Las capturas salen del sitio publicado, no del de pruebas: es lo que ve la
  gente de verdad, con los inmuebles de verdad.
*/
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME =
  'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/videos/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe';

const SALIDA = 'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/capturas/';
const SITIO = 'https://pamplohogar.com';
// Se toma el primer inmueble publicado, para que la ficha siempre exista.
const listado = await fetch('https://api.pamplohogar.com/api/inmuebles?pagina=1').then((r) => r.json());
const ID = listado.inmuebles[0].id;

mkdirSync(SALIDA + 'computador', { recursive: true });
mkdirSync(SALIDA + 'celular', { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--hide-scrollbars', '--force-device-scale-factor=2'],
});

/**
 * Abre una pantalla, espera a que cargue de verdad y la guarda.
 *
 * @param {object} o
 * @param {string} o.archivo   Nombre de salida.
 * @param {string} o.ruta      Ruta del sitio.
 * @param {boolean} o.movil    Si va en tamano de celular.
 * @param {number} [o.bajar]   Cuanto desplazar antes de capturar, en pixeles.
 * @param {string} [o.esperar] Un texto que debe aparecer antes de capturar.
 */
async function capturar({ archivo, ruta, movil, bajar = 0, esperar }) {
  const pagina = await navegador.newPage();

  // El doble de pixeles: en un video a pantalla completa una captura normal se
  // ve borrosa apenas se le hace un poco de zoom.
  await pagina.setViewport(
    movil
      ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { width: 1280, height: 800, deviceScaleFactor: 2 },
  );

  if (movil) {
    await pagina.setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
    );
  }

  await pagina.goto(SITIO + ruta, { waitUntil: 'networkidle2', timeout: 90000 });

  if (esperar) {
    await pagina
      .waitForFunction((t) => document.body.innerText.includes(t), { timeout: 30000 }, esperar)
      .catch(() => process.stdout.write(`   (no aparecio "${esperar}")\n`));
  }

  // Las fotos entran con una animacion al aparecer en pantalla: sin esta pausa
  // salen a medio desvanecer.
  await new Promise((r) => setTimeout(r, 2500));

  if (bajar > 0) {
    await pagina.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), bajar);
    await new Promise((r) => setTimeout(r, 1500));
  }

  const carpeta = movil ? 'celular/' : 'computador/';
  await pagina.screenshot({ path: SALIDA + carpeta + archivo });
  process.stdout.write(`${carpeta}${archivo}\n`);
  await pagina.close();
}

// ---------------------------------------------------------------- computador
await capturar({ archivo: '1-portada.png', ruta: '/', movil: false, esperar: 'Busca menos' });
await capturar({ archivo: '2-listado.png', ruta: '/', movil: false, bajar: 950, esperar: 'disponibles' });
await capturar({ archivo: '3-ficha.png', ruta: `/inmueble/${ID}`, movil: false, esperar: 'al mes' });
await capturar({ archivo: '4-ficha-precio.png', ruta: `/inmueble/${ID}`, movil: false, bajar: 1100 });
await capturar({ archivo: '5-mapa-precios.png', ruta: '/mapa-de-precios', movil: false });
await capturar({ archivo: '6-roomies.png', ruta: '/roomies', movil: false });
await capturar({ archivo: '7-el-proyecto.png', ruta: '/el-proyecto', movil: false });

// ------------------------------------------------------------------- celular
await capturar({ archivo: '1-portada.png', ruta: '/', movil: true, esperar: 'Busca menos' });
await capturar({ archivo: '2-listado.png', ruta: '/', movil: true, bajar: 1150, esperar: 'disponibles' });
await capturar({ archivo: '3-ficha.png', ruta: `/inmueble/${ID}`, movil: true, esperar: 'al mes' });
await capturar({ archivo: '4-ficha-precio.png', ruta: `/inmueble/${ID}`, movil: true, bajar: 1250 });
await capturar({ archivo: '5-ficha-mapa.png', ruta: `/inmueble/${ID}`, movil: true, bajar: 2100 });
await capturar({ archivo: '6-mapa-precios.png', ruta: '/mapa-de-precios', movil: true });
await capturar({ archivo: '7-roomies.png', ruta: '/roomies', movil: true });

await navegador.close();
process.stdout.write('\nListo.\n');
