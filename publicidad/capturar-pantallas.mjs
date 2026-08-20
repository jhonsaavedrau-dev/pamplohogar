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

  Y lo que va fijo a la pantalla se esconde antes de capturar la pagina
  completa: si no, la barra de navegacion de abajo sale estampada en mitad de
  la imagen.

  DOS PANTALLAS NECESITAN AYUDA para existir:

  - El comparador lee la lista de inmuebles del almacen del navegador. Si se
    entra en frio esta vacio, asi que se le siembran tres antes de abrirlo.
  - El panel de filtros esta cerrado hasta que alguien lo abre. Se le da clic
    al boton y se espera a que termine de desplegarse.

  Todo lo que hace este archivo es leer. No inicia sesion, no publica y no
  toca la base de datos.

  Uso:  node capturar-pantallas.mjs
*/
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME =
  'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/videos/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe';

const SALIDA = 'C:/Users/jhons/OneDrive/Desktop/CLAUDECODEFACTORA/PAMPLONAHOGAR/publicidad/capturas/';
const SITIO = 'https://pamplohogar.com';

/*
  Se toman los primeros inmuebles publicados, para que las fichas siempre
  existan aunque cambie el catalogo.

  Con tres intentos porque el servidor es del plan gratuito: si lleva un rato
  sin visitas se duerme, y la primera llamada se cae por tiempo de espera
  mientras despierta. La segunda ya responde.
*/
async function pedirListado() {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      return await fetch('https://api.pamplohogar.com/api/inmuebles?pagina=1').then((r) => r.json());
    } catch {
      process.stdout.write(`El servidor esta despertando, reintento ${intento}...
`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error('El servidor no respondio despues de tres intentos.');
}

const listado = await pedirListado();
const IDS = listado.inmuebles.slice(0, 3).map((i) => i.id);
const ID = IDS[0];

mkdirSync(SALIDA + 'computador', { recursive: true });
mkdirSync(SALIDA + 'celular', { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--hide-scrollbars'],
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} o
 * @param {string} o.archivo
 * @param {string} o.ruta
 * @param {boolean} o.movil
 * @param {boolean} [o.completa]       Pagina entera en vez de una ventana.
 * @param {string} [o.textoEsperado]   Texto que debe aparecer antes de seguir.
 * @param {string[]} [o.sembrar]       Ids a dejar en el comparador.
 * @param {string} [o.pulsar]          Texto del boton que hay que pulsar.
 */
async function capturar({ archivo, ruta, movil, completa = false, textoEsperado, sembrar, pulsar }) {
  // Cada captura va en su propio contexto, con su propio almacen. Sin esto,
  // los tres inmuebles que se le siembran al comparador se quedan puestos y
  // todas las capturas siguientes salen con la barra de "3 de 3 para
  // comparar" pegada abajo.
  const contexto = await navegador.createBrowserContext();
  const pagina = await contexto.newPage();

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

  if (sembrar) {
    // El almacen del navegador es por sitio, asi que hay que estar en el sitio
    // antes de escribirlo: por eso se entra a la portada y luego se navega.
    //
    // Y hay que esperar a que la pagina termine de arrancar. El comparador
    // guarda su lista apenas se monta, asi que si se siembra antes de eso, la
    // propia plataforma lo pisa con una lista vacia un segundo despues.
    await pagina.goto(SITIO, { waitUntil: 'networkidle2', timeout: 90000 });
    await esperar(2500);
    await pagina.evaluate(
      (ids) => window.localStorage.setItem('pamplohogar.comparador', JSON.stringify(ids)),
      sembrar,
    );
  }

  await pagina.goto(SITIO + ruta, { waitUntil: 'networkidle2', timeout: 90000 });

  if (textoEsperado) {
    await pagina
      .waitForFunction((t) => document.body.innerText.includes(t), { timeout: 30000 }, textoEsperado)
      .catch(() => process.stdout.write(`   (no aparecio "${textoEsperado}")\n`));
  }

  await esperar(2500);

  if (pulsar) {
    const pulsado = await pagina.evaluate((texto) => {
      const boton = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.trim() === texto,
      );
      if (!boton) return false;
      boton.click();
      return true;
    }, pulsar);
    if (!pulsado) process.stdout.write(`   (no encontre el boton "${pulsar}")\n`);
    await esperar(1200);
  }

  if (completa) {
    // Lo que va fijo a la pantalla se esconde. En una captura de pagina
    // completa el navegador dibuja los elementos fijos donde estaban en ese
    // momento, asi que la barra de abajo del celular sale estampada en mitad
    // de la imagen, como si el sitio la tuviera ahi.
    await pagina.evaluate(() => {
      document.querySelectorAll('body *').forEach((el) => {
        if (getComputedStyle(el).position === 'fixed') el.style.display = 'none';
      });
    });

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
  await contexto.close();
}

// ---------------------------------------------------------------- computador
await capturar({ archivo: '1-portada.png', ruta: '/', movil: false, textoEsperado: 'Busca menos' });
await capturar({ archivo: '2-listado-largo.png', ruta: '/', movil: false, completa: true, textoEsperado: 'disponibles' });
await capturar({ archivo: '3-ficha-larga.png', ruta: `/inmueble/${ID}`, movil: false, completa: true, textoEsperado: 'al mes' });
await capturar({ archivo: '4-comparar.png', ruta: '/comparar', movil: false, completa: true, sembrar: IDS });
await capturar({ archivo: '5-mapa-precios.png', ruta: '/mapa-de-precios', movil: false });
await capturar({ archivo: '6-roomies.png', ruta: '/roomies', movil: false });
await capturar({ archivo: '7-el-proyecto.png', ruta: '/el-proyecto', movil: false, completa: true });
await capturar({ archivo: '8-filtros.png', ruta: '/', movil: false, completa: true, pulsar: 'Filtros', textoEsperado: 'disponibles' });

// ------------------------------------------------------------------- celular
await capturar({ archivo: '1-portada.png', ruta: '/', movil: true, textoEsperado: 'Busca menos' });
await capturar({ archivo: '2-listado-largo.png', ruta: '/', movil: true, completa: true, textoEsperado: 'disponibles' });
await capturar({ archivo: '3-ficha-larga.png', ruta: `/inmueble/${ID}`, movil: true, completa: true, textoEsperado: 'al mes' });
await capturar({ archivo: '4-comparar.png', ruta: '/comparar', movil: true, completa: true, sembrar: IDS });
await capturar({ archivo: '5-ficha-imprimible.png', ruta: `/inmueble/${ID}/ficha`, movil: true, completa: true });
await capturar({ archivo: '6-mapa-precios.png', ruta: '/mapa-de-precios', movil: true });
await capturar({ archivo: '7-roomies-largo.png', ruta: '/roomies', movil: true, completa: true });
await capturar({ archivo: '8-filtros.png', ruta: '/', movil: true, pulsar: 'Filtros', completa: true, textoEsperado: 'disponibles' });
await capturar({ archivo: '9-el-proyecto.png', ruta: '/el-proyecto', movil: true, completa: true });

await navegador.close();
process.stdout.write('\nListo.\n');
