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

  // Recien publicado: le sirve al estudiante para saber que todavia esta libre.
  const DIAS_NUEVO = 14;
  const esNuevo =
    Date.now() - new Date(inmueble.creadoEn).getTime() < DIAS_NUEVO * 24 * 60 * 60 * 1000;

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

            {/* Degradado bajo la foto para que la distancia se lea sobre
                cualquier imagen, clara u oscura. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-piedra-900/65 to-transparent"
            />

            {/* Las etiquetas van juntas a la izquierda: a la derecha vive el
                corazon y si comparten esquina se tapan entre si. Se reserva
                espacio a la derecha para que no se monten en pantallas angostas. */}
            <div className="absolute top-3 right-14 left-3 flex flex-wrap items-start gap-1.5">
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-piedra-800 shadow-[var(--shadow-suave)] backdrop-blur-sm">
                {ETIQUETAS_TIPO[inmueble.tipo]}
              </span>

              {esNuevo && (
                <span className="rounded-full bg-verificado-600 px-2.5 py-1 text-xs font-bold text-white shadow-[var(--shadow-suave)]">
                  Nuevo
                </span>
              )}

              {!inmueble.activo && (
                <span className="rounded-full bg-piedra-900/85 px-2.5 py-1 text-xs font-bold text-white">
                  Oculto
                </span>
              )}
            </div>

            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M8 1a5 5 0 0 0-5 5c0 3.6 4.3 8.4 4.5 8.6a.7.7 0 0 0 1 0C8.7 14.4 13 9.6 13 6a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
              {distancia(inmueble.distanciaUniversidadKm)}
            </span>
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

          <p className="mt-1.5 text-sm text-piedra-600">{inmueble.barrio}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">
              {inmueble.habitaciones} {inmueble.habitaciones === 1 ? 'habitación' : 'habitaciones'}
            </span>
            <span className="chip">
              {inmueble.banos} {inmueble.banos === 1 ? 'baño' : 'baños'}
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
