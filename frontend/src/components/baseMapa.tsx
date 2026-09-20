import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/*
  Lo que comparten los tres mapas de la pagina.

  EL FONDO YA NO ES EL DE CARTO. Voyager se veia muy bien, pero CARTO empezo a
  exigir una clave de pago y sus baldosas salen atravesadas por un letrero que
  dice API KEY REQUIRED: el mapa de precios de la pagina en vivo se veia rayado
  de lado a lado. Ahora se dibuja con las baldosas del Humanitarian OSM Team,
  que son libres, no piden clave y ademas vienen en crema y gris, que es la
  paleta de la pagina.

  Si ese servidor no responde, la capa se pasa sola a las baldosas normales de
  OpenStreetMap. Un mapa en blanco es peor que un mapa feo.

  Y hay vista satelite, porque para alguien que no conoce Pamplona ver los
  techos y los arboles de verdad dice mucho mas que un plano de calles.
*/

export type VistaDelMapa = 'mapa' | 'satelite';

const CREDITO_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const CAPAS: Record<VistaDelMapa, { url: string; credito: string; maxZoom: number }> = {
  mapa: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    credito: `${CREDITO_OSM}, baldosas de <a href="https://www.hotosm.org/">HOT</a> y OSM France`,
    maxZoom: 19,
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    credito: 'Imágenes &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

const REPUESTO = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  credito: CREDITO_OSM,
  maxZoom: 19,
};

export function CapaDelMapa({ vista }: { vista: VistaDelMapa }) {
  // Se cambia de servidor despues de varias baldosas fallidas, no de una: una
  // sola que se pierda no significa que el servidor este caido.
  const [fallos, setFallos] = useState(0);
  const capa = vista === 'mapa' && fallos >= 4 ? REPUESTO : CAPAS[vista];

  return (
    <TileLayer
      // La clave obliga a Leaflet a cambiar la capa entera al cambiar de vista.
      key={`${vista}-${capa.url}`}
      url={capa.url}
      attribution={capa.credito}
      maxZoom={capa.maxZoom}
      eventHandlers={{ tileerror: () => setFallos((n) => n + 1) }}
      // Pide las baldosas al doble de resolucion en pantallas que lo aprovechan.
      detectRetina
    />
  );
}

/** El botoncito para pasar de plano a satelite. */
export function BotonDeVista({
  vista,
  alCambiar,
}: {
  vista: VistaDelMapa;
  alCambiar: (v: VistaDelMapa) => void;
}) {
  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-[500] flex overflow-hidden rounded-xl border border-piedra-200 bg-white shadow-[var(--shadow-suave)]">
      {(['mapa', 'satelite'] as VistaDelMapa[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => alCambiar(v)}
          className={`min-h-11 px-3.5 text-sm font-semibold transition-colors ${
            v === vista ? 'bg-terracota-600 text-white' : 'bg-white text-piedra-700'
          }`}
        >
          {v === 'mapa' ? 'Mapa' : 'Satélite'}
        </button>
      ))}
    </div>
  );
}

/**
 * En el celular, arrastrar el mapa se roba el desplazamiento de la pagina.
 *
 * Uno intenta seguir bajando, el dedo cae encima del mapa y en vez de bajar se
 * mueve el mapa. Por eso el mapa empieza quieto y solo se activa cuando la
 * persona lo toca a proposito. En computador no hace falta: ahi se baja con la
 * rueda y la rueda ya esta desactivada sobre el mapa.
 */
export function useMapaQuietoHastaQueLoToquen(activo: boolean) {
  const mapa = useMap();
  const [despierto, setDespierto] = useState(!activo);

  useEffect(() => {
    if (!activo) return;
    if (despierto) {
      mapa.dragging.enable();
      mapa.touchZoom.enable();
    } else {
      mapa.dragging.disable();
      mapa.touchZoom.disable();
    }
  }, [mapa, activo, despierto]);

  return { despierto, despertar: () => setDespierto(true) };
}

export function CapaQuieta({ alDespertar }: { alDespertar: () => void }) {
  return (
    <button
      type="button"
      onClick={alDespertar}
      className="absolute inset-0 z-[400] grid place-items-center bg-piedra-900/10 text-sm font-semibold"
    >
      <span className="rounded-full bg-white/95 px-4 py-2 text-piedra-800 shadow-[var(--shadow-suave)]">
        Toca para mover el mapa
      </span>
    </button>
  );
}

/** Si el aparato es de tocar, para saber si hace falta lo de arriba. */
export const esDeTocar = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Marcador con forma de gota y sombra.
 *
 * Se dibuja a mano porque los iconos que trae Leaflet se buscan por ruta
 * relativa y eso se rompe al empaquetar la pagina.
 */
export const gota = (color: string, tamano = 44): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<svg viewBox="0 0 40 52" width="${tamano}" height="${tamano * 1.3}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-50%" y="-30%" width="200%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#241F1A" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path filter="url(#s)" fill="${color}" stroke="#FFFFFF" stroke-width="2.5"
        d="M20 2C11.2 2 4 9.2 4 18c0 11.4 14.3 29.3 14.9 30a1.4 1.4 0 0 0 2.2 0C21.7 47.3 36 29.4 36 18 36 9.2 28.8 2 20 2Z"/>
      <circle cx="20" cy="18" r="6" fill="#FFFFFF"/>
    </svg>`,
    iconSize: [tamano, tamano * 1.3],
    iconAnchor: [tamano / 2, tamano * 1.3],
    popupAnchor: [0, -tamano * 1.2],
  });

/** Etiqueta con el precio, para el mapa de precios. */
export const etiquetaDePrecio = (texto: string, color: string): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<span style="
      display:inline-block; white-space:nowrap; transform:translate(-50%,-50%);
      background:${color}; color:#fff; font-weight:700; font-size:12px;
      padding:5px 9px; border-radius:999px; border:2px solid #fff;
      box-shadow:0 2px 6px rgba(36,31,26,.35);">${texto}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
