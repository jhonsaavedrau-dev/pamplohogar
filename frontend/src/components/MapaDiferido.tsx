import { Suspense, lazy } from 'react';

/**
 * Leaflet pesa bastante y solo hace falta en el detalle y en el formulario.
 * Se carga aparte para que la busqueda abra rapido con datos moviles.
 */
const Mapa = lazy(() => import('./Mapa').then((m) => ({ default: m.Mapa })));
const MapaSelector = lazy(() =>
  import('./MapaSelector').then((m) => ({ default: m.MapaSelector })),
);

function Marcador({ alto }: { alto: string }) {
  return (
    <div
      className={`${alto} grid animate-pulse place-items-center rounded-2xl border border-piedra-200 bg-piedra-100 text-sm text-piedra-400`}
    >
      Cargando el mapa...
    </div>
  );
}

interface PropsMapa {
  lat: number;
  lng: number;
  titulo: string;
  direccion: string;
}

export function MapaDiferido(props: PropsMapa) {
  return (
    <Suspense fallback={<Marcador alto="h-72" />}>
      <Mapa {...props} />
    </Suspense>
  );
}

interface PropsSelector {
  lat: number;
  lng: number;
  alElegir: (lat: number, lng: number) => void;
}

export function MapaSelectorDiferido(props: PropsSelector) {
  return (
    <Suspense fallback={<Marcador alto="h-64" />}>
      <MapaSelector {...props} />
    </Suspense>
  );
}
