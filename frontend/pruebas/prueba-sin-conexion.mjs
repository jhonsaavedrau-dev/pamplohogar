// Comprueba que el trabajador de fondo se porte bien cuando no hay senal.
//   node pruebas/prueba-sin-conexion.mjs
//
// No hace falta navegador: se carga public/sw.js con imitaciones de `self`,
// `caches` y `fetch`, y se le piden cosas como se las pediria Chrome. Asi se
// prueba lo unico que de verdad puede fallar, que es la logica.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const aqui = dirname(fileURLToPath(import.meta.url));
const codigo = readFileSync(join(aqui, '..', 'public', 'sw.js'), 'utf8');

console.log('Probando la pagina sin conexion\n');

let ok = 0;
let fallas = 0;

async function probar(nombre, fn) {
  try {
    const r = await fn();
    console.log(`OK    ${nombre}${r ? ` -> ${r}` : ''}`);
    ok++;
  } catch (e) {
    console.log(`FALLA ${nombre} :: ${e.message}`);
    fallas++;
  }
}

const exigir = (c, m) => {
  if (!c) throw new Error(m);
};

/** Una caja de guardados igual de simple que la del navegador. */
class CajaFalsa {
  constructor() {
    this.datos = new Map();
  }
  async put(peticion, respuesta) {
    this.datos.set(typeof peticion === 'string' ? peticion : peticion.url, respuesta);
  }
  async add(url) {
    const r = await globalThis.fetch(url);
    if (!r.ok) throw new Error(`no se pudo guardar ${url}`);
    this.datos.set(url, r);
  }
  async match(peticion) {
    return this.datos.get(typeof peticion === 'string' ? peticion : peticion.url);
  }
}

/** Arma un mundo nuevo para el trabajador y devuelve con que quedarse. */
function montar({ respuestaDeLaRed }) {
  const oyentes = {};
  const cajas = new Map();

  const caches = {
    async open(nombre) {
      if (!cajas.has(nombre)) cajas.set(nombre, new CajaFalsa());
      return cajas.get(nombre);
    },
    async keys() {
      return [...cajas.keys()];
    },
    async delete(nombre) {
      return cajas.delete(nombre);
    },
    async match(peticion) {
      for (const caja of cajas.values()) {
        const r = await caja.match(peticion);
        if (r) return r;
      }
      return undefined;
    },
  };

  const self = {
    addEventListener: (nombre, fn) => {
      oyentes[nombre] = fn;
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };

  const contexto = {
    self,
    caches,
    fetch: respuestaDeLaRed,
    URL,
    Response,
    Request,
    Promise,
    console,
  };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);

  return { oyentes, cajas, caches, contexto };
}

/** Dispara un evento de peticion y devuelve lo que contesta el trabajador. */
async function pedir(mundo, url, opciones = {}) {
  let respuesta;
  const evento = {
    request: { url, method: opciones.metodo ?? 'GET', mode: opciones.modo ?? 'cors' },
    respondWith: (p) => {
      respuesta = p;
    },
    waitUntil: (p) => p,
  };
  mundo.oyentes.fetch(evento);
  return respuesta === undefined ? undefined : await respuesta;
}

const conCuerpo = (texto, estado = 200) =>
  new Response(texto, { status: estado, headers: { 'Content-Type': 'application/json' } });

// --- con internet ---------------------------------------------------------

await probar('con internet, los datos vienen del servidor', async () => {
  const mundo = montar({ respuestaDeLaRed: async () => conCuerpo('{"desde":"servidor"}') });
  const r = await pedir(mundo, 'http://x/api/inmuebles');
  const cuerpo = await r.json();
  exigir(cuerpo.desde === 'servidor', `vino de ${cuerpo.desde}`);
  return 'primero la red, para no negociar con un precio viejo';
});

await probar('lo que devuelve el servidor queda guardado', async () => {
  const mundo = montar({ respuestaDeLaRed: async () => conCuerpo('{"desde":"servidor"}') });
  await pedir(mundo, 'http://x/api/inmuebles/abc');
  await new Promise((r) => setTimeout(r, 10));
  const guardada = await mundo.caches.match({ url: 'http://x/api/inmuebles/abc' });
  exigir(guardada !== undefined, 'no guardo nada');
});

await probar('una respuesta con error no se guarda', async () => {
  const mundo = montar({ respuestaDeLaRed: async () => conCuerpo('{"mensaje":"no existe"}', 404) });
  await pedir(mundo, 'http://x/api/inmuebles/nada');
  await new Promise((r) => setTimeout(r, 10));
  const guardada = await mundo.caches.match({ url: 'http://x/api/inmuebles/nada' });
  exigir(guardada === undefined, 'guardo un error como si fuera bueno');
  return 'si no, un fallo de un segundo quedaria pegado';
});

// --- sin internet ---------------------------------------------------------

await probar('sin internet, sale lo que ya se habia abierto', async () => {
  let hayRed = true;
  const mundo = montar({
    respuestaDeLaRed: async () => {
      if (!hayRed) throw new Error('sin senal');
      return conCuerpo('{"precio":320000}');
    },
  });

  await pedir(mundo, 'http://x/api/inmuebles/abc');
  await new Promise((r) => setTimeout(r, 10));

  hayRed = false;
  const r = await pedir(mundo, 'http://x/api/inmuebles/abc');
  const cuerpo = await r.json();
  exigir(cuerpo.precio === 320000, `salio ${JSON.stringify(cuerpo)}`);
  return 'el estudiante puede volver a mirar el precio en el bus';
});

await probar('sin internet y sin haberlo abierto antes, lo dice claro', async () => {
  const mundo = montar({
    respuestaDeLaRed: async () => {
      throw new Error('sin senal');
    },
  });
  const r = await pedir(mundo, 'http://x/api/inmuebles/nunca-visto');
  exigir(r.status === 503, `estado ${r.status}`);
  const cuerpo = await r.json();
  exigir(/[Ss]in conexi/.test(cuerpo.mensaje), `mensaje: ${cuerpo.mensaje}`);
  return cuerpo.mensaje;
});

await probar('sin internet, la pagina igual abre', async () => {
  let hayRed = true;
  const mundo = montar({
    respuestaDeLaRed: async () => {
      if (!hayRed) throw new Error('sin senal');
      return new Response('<html>la pagina</html>', { status: 200 });
    },
  });

  await pedir(mundo, 'http://x/inmueble/abc', { modo: 'navigate' });
  await new Promise((r) => setTimeout(r, 10));

  hayRed = false;
  const r = await pedir(mundo, 'http://x/mensajes', { modo: 'navigate' });
  const texto = await r.text();
  exigir(texto.includes('la pagina'), `salio: ${texto.slice(0, 40)}`);
  return 'aunque sea otra direccion, porque la aplicacion arma la pantalla sola';
});

// --- lo que no se debe tocar ---------------------------------------------

await probar('publicar o enviar nunca sale de lo guardado', async () => {
  const mundo = montar({ respuestaDeLaRed: async () => conCuerpo('{"ok":true}') });
  const r = await pedir(mundo, 'http://x/api/inmuebles', { metodo: 'POST' });
  exigir(r === undefined, 'el trabajador se metio en un envio');
  return 'un mensaje enviado desde el cache seria un mensaje que nunca llego';
});

await probar('las fotos y los archivos salen al instante de lo guardado', async () => {
  let vueltas = 0;
  const mundo = montar({
    respuestaDeLaRed: async () => {
      vueltas++;
      return new Response('imagen', { status: 200 });
    },
  });

  await pedir(mundo, 'http://x/assets/foto.jpg');
  await new Promise((r) => setTimeout(r, 10));
  const antes = vueltas;

  const r = await pedir(mundo, 'http://x/assets/foto.jpg');
  exigir((await r.text()) === 'imagen', 'no devolvio la imagen');
  exigir(vueltas === antes + 1, 'no fue a buscar la version nueva por detras');
  return 'y de fondo revisa si cambio';
});

await probar('al cambiar de version se borra lo viejo', async () => {
  const mundo = montar({ respuestaDeLaRed: async () => new Response('x') });
  mundo.cajas.set('pamplohogar-v0-archivos', new CajaFalsa());
  mundo.cajas.set('pamplohogar-v1-archivos', new CajaFalsa());

  const esperas = [];
  await mundo.oyentes.activate({ waitUntil: (p) => esperas.push(p) });
  await Promise.all(esperas);

  const quedan = await mundo.caches.keys();
  exigir(!quedan.includes('pamplohogar-v0-archivos'), 'dejo la caja vieja');
  exigir(quedan.includes('pamplohogar-v1-archivos'), 'borro la caja nueva');
  return 'si no, un cambio nuevo nunca le llegaria a quien ya entro';
});

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
