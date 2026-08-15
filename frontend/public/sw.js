/*
  El trabajador de fondo que hace que la pagina sirva sin internet.

  Muchos estudiantes andan con datos justos y en Pamplona hay zonas donde el
  celular se queda sin senal. Lo que ya viste queda guardado y se puede volver
  a mirar aunque no haya conexion: el precio, la direccion, lo que incluye.

  No se usa ninguna libreria. Son cuarenta lineas y meter una dependencia de
  construccion por esto seria pagar de mas.
*/

// Al cambiar este numero se descartan todos los guardados viejos.
const VERSION = 'pamplohogar-v2';
const CAJA_ARCHIVOS = `${VERSION}-archivos`;
const CAJA_DATOS = `${VERSION}-datos`;

/** Lo minimo para que la pagina abra sin internet. */
const BASICOS = ['/', '/index.html', '/marca.svg', '/manifest.webmanifest'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CAJA_ARCHIVOS)
      // Si alguno falla no se cae la instalacion entera.
      .then((caja) => Promise.allSettled(BASICOS.map((u) => caja.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Guarda una copia sin dejar que un fallo al guardar rompa la respuesta. */
const guardar = (caja, peticion, respuesta) => {
  caches
    .open(caja)
    .then((c) => c.put(peticion, respuesta))
    .catch(() => {});
};

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  const esApi = url.pathname.startsWith('/api/');

  // Navegar: si no hay internet, se abre la pagina guardada y React se
  // encarga de mostrar lo que tenga.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((r) => {
          guardar(CAJA_ARCHIVOS, '/index.html', r.clone());
          return r;
        })
        .catch(() => caches.match('/index.html').then((r) => r ?? Response.error())),
    );
    return;
  }

  if (esApi) {
    // Primero internet, porque un precio viejo puede hacer que alguien vaya a
    // negociar con una cifra que ya cambio. Solo si no hay senal se muestra
    // lo guardado.
    evento.respondWith(
      fetch(peticion)
        .then((r) => {
          if (r.ok) guardar(CAJA_DATOS, peticion, r.clone());
          return r;
        })
        .catch(() =>
          caches.match(peticion).then((r) => {
            if (r) return r;
            return new Response(
              JSON.stringify({ mensaje: 'Sin conexión. Esto todavía no lo has abierto.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } },
            );
          }),
        ),
    );
    return;
  }

  // Archivos de la aplicacion y fotos: primero lo guardado, que abre al
  // instante, y de fondo se pide la version nueva.
  evento.respondWith(
    caches.match(peticion).then((guardada) => {
      const desdeLaRed = fetch(peticion)
        .then((r) => {
          if (r.ok) guardar(CAJA_ARCHIVOS, peticion, r.clone());
          return r;
        })
        .catch(() => guardada ?? Response.error());
      return guardada ?? desdeLaRed;
    }),
  );
});
