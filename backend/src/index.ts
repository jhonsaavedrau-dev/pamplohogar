import { crearApp } from './app.js';
import { env } from './lib/env.js';

const app = crearApp();

app.listen(env.PORT, () => {
  process.stdout.write(`PamploHogar API escuchando en http://localhost:${env.PORT}\n`);
});
