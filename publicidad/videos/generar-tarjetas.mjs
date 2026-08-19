/*
  Genera todas las tarjetas para CapCut de un solo golpe.

  Existe porque los rotulos del acto 3 son seis y cada uno cambia solo el
  texto: hacerlos a mano seria repetir el mismo comando seis veces con una
  frase distinta, y ahi es donde uno se equivoca.

  El texto se pasa por un archivo y no por la linea de comandos: en Windows las
  comillas del JSON se pierden por el camino y Remotion recibe basura. El
  propio Remotion lo advierte en su mensaje de error.

  Uso:  node generar-tarjetas.mjs
*/
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

mkdirSync('tarjetas', { recursive: true });

const ROTULOS = [
  ['01-todos', 'Todos, en un solo sitio'],
  ['02-precio', 'El precio, sin preguntar'],
  ['03-distancia', 'A cuántos minutos queda de la U'],
  ['04-comparacion', 'Si te cobran de más, te lo dice'],
  ['05-resenas', 'Lo que dicen los que vivieron ahí'],
  ['06-contacto', 'Y escribes cuando tú decidas'],
];

const remotion = (args) => execFileSync('npx', ['remotion', ...args], { stdio: 'pipe', shell: true });

const CONFIG = 'tarjetas/.texto.json';

for (const [archivo, texto] of ROTULOS) {
  writeFileSync(CONFIG, JSON.stringify({ texto }), 'utf8');
  remotion(['still', 'TarjetaFuncion', `tarjetas/rotulo-${archivo}.png`, `--props=${CONFIG}`]);
  process.stdout.write(`rotulo-${archivo}.png   "${texto}"\n`);
}

rmSync(CONFIG, { force: true });

remotion(['still', 'TarjetaGiro', 'tarjetas/giro.png']);
remotion(['still', 'TarjetaCierre', 'tarjetas/cierre.png']);
process.stdout.write('giro.png\ncierre.png\n');
