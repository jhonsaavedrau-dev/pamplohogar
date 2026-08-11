import type { ReactNode } from 'react';
import { IconoMarca } from './Marca';

export function Cargando({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-piedra-600">
      <IconoMarca className="h-10 w-10 animate-pulse text-terracota-200" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function TarjetaFantasma() {
  return (
    <div className="tarjeta overflow-hidden">
      <div className="h-44 animate-pulse bg-piedra-100" />
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
}

export function EstadoVacio({ titulo, descripcion, accion }: PropsVacio) {
  return (
    <div className="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
      <IconoMarca className="h-12 w-12 text-piedra-200" />
      <h3 className="text-lg font-bold text-piedra-900">{titulo}</h3>
      <p className="max-w-sm text-sm text-piedra-600">{descripcion}</p>
      {accion}
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
      <h3 className="text-lg font-bold text-terracota-700">Algo no salio bien</h3>
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
