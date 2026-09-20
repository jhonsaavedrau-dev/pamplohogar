/*
  La imagen que aparece cuando alguien manda el enlace por WhatsApp, Facebook
  o X, y la portada de Play Store.

  Se arma como una pagina HTML y se fotografia, en vez de pedirle la imagen
  entera a la IA: la IA escribe mal el espanol y no sabe cual es la letra de la
  marca. La foto la pone Higgsfield; el texto y el logo, esta pagina.

    node imagen-para-compartir.mjs

  Salen dos archivos:
    ../frontend/public/compartir.jpg        1200 x 630, la de los enlaces
    digital/play-store-portada.png          1024 x 500, la de la tienda
*/
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = join(
  AQUI,
  'videos/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe',
);

const enLinea = (archivo, tipo) =>
  `data:${tipo};base64,${readFileSync(join(AQUI, archivo)).toString('base64')}`;
const FOTO = enLinea('fotos-de-ambiente/ventana-abierta.jpg', 'image/jpeg');
const LOGO = enLinea('marca-completa.png', 'image/png');

// Escala todo a partir del alto, para que las dos piezas salgan del mismo molde.
const pagina = (ancho, alto) => {
  const u = alto / 630;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Fraunces:opsz,wght@9..144,600&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${ancho}px; height: ${alto}px; display: grid;
         grid-template-columns: 50% 50%; background: #faf8f5; overflow: hidden;
         font-family: Inter, sans-serif; }
  .texto { padding: ${64 * u}px ${56 * u}px ${56 * u}px ${64 * u}px; display: flex;
           flex-direction: column; }
  .logo { height: ${40 * u}px; width: auto; align-self: flex-start; }
  h1 { font-family: Fraunces, serif; font-weight: 600; font-size: ${76 * u}px;
       line-height: .98; letter-spacing: -0.03em; color: #1f1b17; margin-top: auto; }
  h1 span { display: block; color: #b25317; }
  p { margin-top: ${22 * u}px; font-size: ${25 * u}px; line-height: 1.35; color: #655e52;
      font-weight: 500; }
  .web { margin-top: ${30 * u}px; font-size: ${19 * u}px; font-weight: 600;
         color: #8c4013; letter-spacing: .02em; }
  .foto { background: url(${FOTO}) 58% center / cover; }
</style></head><body>
  <div class="texto">
    <img class="logo" src="${LOGO}">
    <h1>Busca menos.<span>Elige mejor.</span></h1>
    <p>Vivienda para estudiantes en Pamplona.</p>
    <div class="web">pamplohogar.com</div>
  </div>
  <div class="foto"></div>
</body></html>`;
};

const navegador = await puppeteer.launch({ executablePath: CHROME });
for (const [ancho, alto, salida, tipo] of [
  [1200, 630, '../frontend/public/compartir.jpg', 'jpeg'],
  [1024, 500, 'digital/play-store-portada.png', 'png'],
]) {
  const p = await navegador.newPage();
  await p.setViewport({ width: ancho, height: alto });
  await p.setContent(pagina(ancho, alto), { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({
    path: join(AQUI, salida),
    type: tipo,
    ...(tipo === 'jpeg' ? { quality: 86 } : {}),
  });
  console.log('listo', salida);
  await p.close();
}
await navegador.close();
