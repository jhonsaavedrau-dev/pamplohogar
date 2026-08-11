import { useState } from 'react';
import type { Foto } from '../lib/tipos';
import { FotoInmueble } from './FotoInmueble';

export function Carrusel({ fotos, titulo }: { fotos: Foto[]; titulo: string }) {
  const [indice, setIndice] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-piedra-100 text-sm text-piedra-400 sm:h-96">
        Este inmueble todavia no tiene fotos
      </div>
    );
  }

  const anterior = () => setIndice((i) => (i === 0 ? fotos.length - 1 : i - 1));
  const siguiente = () => setIndice((i) => (i === fotos.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-2xl bg-piedra-100 sm:h-96">
        <FotoInmueble
          url={fotos[indice].url}
          alt={`${titulo}, foto ${indice + 1} de ${fotos.length}`}
          cargaDiferida={false}
          className="h-full w-full object-cover"
        />

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl font-bold text-piedra-800 shadow-md"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute top-1/2 right-2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl font-bold text-piedra-800 shadow-md"
            >
              ›
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-piedra-900/75 px-3 py-1 text-xs font-semibold text-white">
              {indice + 1} / {fotos.length}
            </span>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === indice ? 'border-terracota-500' : 'border-transparent'
              }`}
            >
              <FotoInmueble url={foto.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
