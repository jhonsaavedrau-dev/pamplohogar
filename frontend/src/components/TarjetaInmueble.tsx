import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { useComparador } from '../lib/comparador';
import type { Inmueble } from '../lib/tipos';
import { ETIQUETAS_TIPO } from '../lib/tipos';
import { distancia, pesos } from '../lib/formato';
import { Estrellas } from './Estrellas';
import { FotoInmueble } from './FotoInmueble';

interface Props {
  inmueble: Inmueble;
  accion?: ReactNode;
  /** El comparador y los favoritos no tienen sentido en la pantalla del arrendador. */
  comparable?: boolean;
  favorito?: boolean;
}

function IconoCorazon({ lleno }: { lleno: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13Z"
        fill={lleno ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TarjetaInmueble({
  inmueble,
  accion,
  comparable = true,
  favorito = false,
}: Props) {
  const portada = inmueble.fotos[0];
  const { usuario } = useSesion();
  const { contiene, alternar, estaLleno } = useComparador();
  const clienteQuery = useQueryClient();
  const marcado = contiene(inmueble.id);

  const guardar = useMutation({
    mutationFn: (activar: boolean) =>
      pedir(`/api/favoritos/${inmueble.id}`, { metodo: activar ? 'POST' : 'DELETE' }),
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['favoritos'] });
      void clienteQuery.invalidateQueries({ queryKey: ['inmueble', inmueble.id] });
    },
  });

  const puedeGuardar = usuario !== null && usuario.id !== inmueble.arrendador.id;

  return (
    <article
      data-revelar
      className="group tarjeta overflow-hidden transition-[transform,box-shadow,border-color,opacity] duration-300 ease-[var(--ease-suave)] hover:-translate-y-1.5 hover:border-piedra-300 hover:shadow-[var(--shadow-elevada)]"
    >
      <div className="relative">
        <Link to={`/inmueble/${inmueble.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-piedra-100">
            {portada ? (
              <FotoInmueble
                url={portada.url}
                alt={inmueble.titulo}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-piedra-400">
                Sin fotos
              </div>
            )}

            <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-piedra-800 shadow-[var(--shadow-suave)] backdrop-blur-sm">
              {ETIQUETAS_TIPO[inmueble.tipo]}
            </span>

            {!inmueble.activo && (
              <span className="absolute bottom-3 left-3 rounded-full bg-piedra-900/85 px-2.5 py-1 text-xs font-bold text-white">
                Oculto
              </span>
            )}
          </div>
        </Link>

        {favorito && puedeGuardar && (
          <button
            type="button"
            disabled={guardar.isPending}
            onClick={() => guardar.mutate(true)}
            aria-label={`Guardar ${inmueble.titulo} en favoritos`}
            className="absolute top-2.5 right-2.5 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-piedra-700 shadow-[var(--shadow-suave)] backdrop-blur-sm transition-colors hover:text-terracota-600 disabled:opacity-50"
          >
            <IconoCorazon lleno={false} />
          </button>
        )}
      </div>

      <div className="p-4">
        <Link to={`/inmueble/${inmueble.id}`} className="block">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[1.35rem] leading-none font-extrabold tracking-tight text-piedra-900">
              {pesos(inmueble.precio)}
            </p>
            <span className="shrink-0 text-xs font-medium text-piedra-600">al mes</span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-[0.95rem] leading-snug font-semibold text-piedra-800">
            {inmueble.titulo}
          </h3>

          <p className="mt-1.5 text-sm text-piedra-600">
            {inmueble.barrio}
            <span className="mx-1.5 text-piedra-300" aria-hidden="true">
              ·
            </span>
            {distancia(inmueble.distanciaUniversidadKm)}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">
              {inmueble.habitaciones} {inmueble.habitaciones === 1 ? 'habitacion' : 'habitaciones'}
            </span>
            <span className="chip">
              {inmueble.banos} {inmueble.banos === 1 ? 'bano' : 'banos'}
            </span>
            {inmueble.amoblado && <span className="chip">Amoblado</span>}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-piedra-100 pt-3">
            <span className="truncate text-xs text-piedra-600">{inmueble.arrendador.nombre}</span>
            <Estrellas
              valor={inmueble.arrendador.calificacionPromedio}
              total={inmueble.arrendador.totalResenas}
            />
          </div>
        </Link>
      </div>

      {comparable && (
        <div className="border-t border-piedra-100 px-4 py-2.5">
          <label
            className={`flex cursor-pointer items-center gap-2.5 text-sm font-medium ${
              !marcado && estaLleno ? 'cursor-not-allowed text-piedra-400' : 'text-piedra-700'
            }`}
          >
            <input
              type="checkbox"
              className="h-[18px] w-[18px] rounded border-piedra-300 text-confianza-500 focus:ring-confianza-500"
              checked={marcado}
              disabled={!marcado && estaLleno}
              onChange={() => alternar(inmueble.id)}
            />
            {marcado ? 'Se va a comparar' : estaLleno ? 'Ya elegiste tres' : 'Comparar'}
          </label>
        </div>
      )}

      {accion && <div className="border-t border-piedra-100 p-3">{accion}</div>}
    </article>
  );
}
