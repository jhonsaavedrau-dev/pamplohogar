/*
  Capturas de pamplohogar.com, en computador y en celular.

  Se usa el Chrome que ya descargo Remotion, para no bajar otro navegador de
  200 megas solo para esto.

  DOS TIPOS DE CAPTURA, y la diferencia importa:

  - "ventana": lo que cabe en la pantalla. Sirve para mostrar una pantalla
    quieta.
  - "completa": la pagina entera de arriba a abajo, aunque mida cinco
    pantallas. Sirve para el video: teniendo la imagen larga se puede
    DESPLAZAR dentro del marco del telefono, que se ve como alguien bajando de
    verdad. Antes se agrandaba una captura corta para simular movimiento, y al
    agrandar se veia borrosa.

  Antes de capturar la pagina completa hay que recorrerla entera: la plataforma
  hace aparecer las tarjetas cuando entran en pantalla, asi que lo que nunca
  se vio sale invisible en la foto.

  Uso:  node capturar-pantallas.mjs
*/
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME =
  'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/videos/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe';

const SALIDA = 'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/capturas/';
const SITIO = 'https://pamplohogar.com';

// Se toma el primer inmueble publicado, para que la ficha siempre exista.
const listado = await fetch('https://api.pamplohogar.com/api/inmuebles?pagina=1').then((r) =>
  r.json(),
);
const ID = listado.inmuebles[0].id;

mkdirSync(SALIDA + 'computador', { recursive: true });
mkdirSync(SALIDA + 'celular', { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--hide-scrollbars'],
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function capturar({ archivo, ruta, movil, completa = false, textoEsperado }) {
  const pagina = await navegador.newPage();

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

  if (textoEsperado) {
    await pagina
      .waitForFunction((t) => document.body.innerText.includes(t), { timeout: 30000 }, textoEsperado)
      .catch(() => process.stdout.write(`   (no aparecio "${textoEsperado}")\n`));
  }

  await esperar(2500);

  if (completa) {
    // Se recorre la pagina entera para que todo aparezca, y se vuelve arriba.
    await pagina.evaluate(async () => {
      const alto = document.body.scrollHeight;
      for (let y = 0; y < alto; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await esperar(1200);
  }

  const carpeta = movil ? 'celular/' : 'computador/';
  await pagina.screenshot({ path: SALIDA + carpeta + archivo, fullPage: completa });

  const medidas = await pagina.evaluate(() => ({
    alto: document.body.scrollHeight,
    ventana: window.innerHeight,
  }));
  process.stdout.write(
    `${carpeta}${archivo}  ${completa ? `pagina completa, ${Math.round(medidas.alto / medidas.ventana)} pantallas de alto` : 'una ventana'}\n`,
  );

  await pagina.close();
}

// ---------------------------------------------------------------- computador
await capturar({ archivo: '1-portada.png', ruta: '/', movil: false, textoEsperado: 'Busca menos' });
await capturar({ archivo: '2-listado-largo.png', ruta: '/', movil: false, completa: true, textoEsperado: 'disponibles' });
await capturar({ archivo: '3-ficha-larga.png', ruta: `/inmueble/${ID}`, movil: false, completa: true, textoEsperado: 'al mes' });
await capturar({ archivo: '5-mapa-precios.png', ruta: '/mapa-de-precios', movil: false });
await capturar({ archivo: '6-roomies.png', ruta: '/roomies', movil: false });
await capturar({ archivo: '7-el-proyecto.png', ruta: '/el-proyecto', movil: false });

// ------------------------------------------------------------------- celular
await capturar({ archivo: '1-portada.png', ruta: '/', movil: true, textoEsperado: 'Busca menos' });
await capturar({ archivo: '2-listado-largo.png', ruta: '/', movil: true, completa: true, textoEsperado: 'disponibles' });
await capturar({ archivo: '3-ficha-larga.png', ruta: `/inmueble/${ID}`, movil: true, completa: true, textoEsperado: 'al mes' });
await capturar({ archivo: '6-mapa-precios.png', ruta: '/mapa-de-precios', movil: true });
await capturar({ archivo: '7-roomies-largo.png', ruta: '/roomies', movil: true, completa: true });

await navegador.close();
process.stdout.write('\nListo.\n');
