// Uso: node foto-pagina.mjs <ruta> <ancho> <salida.png> [alto]
import puppeteer from 'puppeteer-core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = join(AQUI, 'videos/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
const [ruta = '/', ancho = '1366', salida = 'foto.png', alto] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: CHROME });
const p = await b.newPage();
await p.setViewport({ width: +ancho, height: alto ? +alto : 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:5173' + ruta, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
// Las tarjetas aparecen al entrar en pantalla: hay que pasar por todas.
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 1500));
if (!alto) await p.evaluate(() => document.querySelectorAll('body *').forEach((e) => { if (getComputedStyle(e).position === 'fixed') e.style.display = 'none'; }));
await p.screenshot({ path: salida, fullPage: !alto });
await b.close();
