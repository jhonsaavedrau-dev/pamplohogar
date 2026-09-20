import type { ReactNode } from 'react';
import { IconoMarca } from './Marca';

export function Cargando({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-piedra-600">
      <IconoMarca className="h-10 w-10 animate-pulse opacity-70" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function TarjetaFantasma() {
  return (
    <div className="tarjeta overflow-hidden">
      <div className="aspect-square animate-pulse bg-piedra-100" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-piedra-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-piedra-100" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-piedra-100" />
      </div>
    </div>
  );
}

interface PropsVacio {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  /** Foto de ambiente para las pantallas vacias que mas pesan, como la del
      arrendador que todavia no publica. Las demas se quedan con las tejas. */
  foto?: string;
}

/*
  Las tejas del centro historico, de fondo.

  Una pantalla vacia es la que mas se ve al principio: sin inmuebles guardados,
  sin mensajes, sin busquedas. Era un cuadro gris con el logo apagado, que se
  lee como "aqui se dano algo" y no como "aqui todavia no hay nada". Las tejas
  la convierten en parte de la plataforma en vez de un hueco.

  Van muy claras y se desvanecen hacia abajo, para que el texto siempre gane.
*/
function TejasSuaves() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-terracota-400/20"
    >
      <defs>
        <pattern id="tejas-vacio" width="36" height="18" patternUnits="userSpaceOnUse">
          <path
            d="M0 18C0 8 8 0 18 0s18 8 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </pattern>
        <linearGradient id="desvanecer-vacio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="mascara-vacio">
          <rect width="100%" height="100%" fill="url(#desvanecer-vacio)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#tejas-vacio)" mask="url(#mascara-vacio)" />
    </svg>
  );
}

export function EstadoVacio({ titulo, descripcion, accion, foto }: PropsVacio) {
  if (foto) {
    return (
      <div className="tarjeta grid overflow-hidden sm:grid-cols-2">
        <img
          src={foto}
          alt=""
          width={1200}
          height={675}
          loading="lazy"
          className="h-44 w-full object-cover sm:h-full sm:min-h-72"
        />
        <div className="flex flex-col items-start justify-center gap-3 px-6 py-8 sm:px-10">
          <h3 className="text-2xl leading-tight font-semibold tracking-tight text-piedra-900">
            {titulo}
          </h3>
          <p className="max-w-sm text-piedra-600">{descripcion}</p>
          {accion}
        </div>
      </div>
    );
  }

  return (
    <div className="tarjeta relative overflow-hidden px-6 py-14 text-center">
      <TejasSuaves />
      <div className="relative flex flex-col items-center gap-3">
        <IconoMarca className="h-12 w-12 opacity-60" />
        <h3 className="text-lg font-bold text-piedra-900">{titulo}</h3>
        <p className="max-w-sm text-sm text-piedra-600">{descripcion}</p>
        {accion}
      </div>
    </div>
  );
}

interface PropsError {
  mensaje: string;
  alReintentar?: () => void;
}

export function EstadoError({ mensaje, alReintentar }: PropsError) {
  return (
    <div className="rounded-2xl border border-terracota-200 bg-terracota-50 px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-terracota-700">Algo no salió bien</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-piedra-600">{mensaje}</p>
      {alReintentar && (
        <button type="button" onClick={alReintentar} className="boton-suave mt-4">
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function Aviso({ tipo, children }: { tipo: 'error' | 'exito'; children: ReactNode }) {
  const estilos =
    tipo === 'error'
      ? 'border-terracota-200 bg-terracota-50 text-terracota-700'
      : 'border-confianza-100 bg-confianza-50 text-confianza-700';
  return (
    <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-medium ${estilos}`}>
      {children}
    </p>
  );
}
