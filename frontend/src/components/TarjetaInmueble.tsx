import { Link } from 'react-router-dom';
import type { Inmueble } from '../lib/tipos';
import { ETIQUETAS_TIPO } from '../lib/tipos';
import { distancia, pesos } from '../lib/formato';
import { Estrellas } from './Estrellas';
import { FotoInmueble } from './FotoInmueble';
import { useComparador } from '../lib/comparador';

interface Props {
  inmueble: Inmueble;
  accion?: React.ReactNode;
  /** El comparador no tiene sentido en la pantalla del arrendador. */
  comparable?: boolean;
}

export function TarjetaInmueble({ inmueble, accion, comparable = true }: Props) {
  const portada = inmueble.fotos[0];
  const { contiene, alternar, estaLleno } = useComparador();
  const marcado = contiene(inmueble.id);

  return (
    <article className="tarjeta group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-terracota-200 hover:shadow-[0_10px_28px_rgba(36,31,26,0.10)]">
      <Link to={`/inmueble/${inmueble.id}`} className="block">
        <div className="relative h-44 bg-piedra-100">
          {portada ? (
            <FotoInmueble
              url={portada.url}
              alt={inmueble.titulo}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-piedra-400">
              Sin fotos
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-piedra-800 shadow-sm">
            {ETIQUETAS_TIPO[inmueble.tipo]}
          </span>
          {!inmueble.activo && (
            <span className="absolute top-3 right-3 rounded-full bg-piedra-800 px-3 py-1 text-xs font-bold text-white">
              Oculto
            </span>
          )}
        </div>

        <div className="space-y-2 p-4">
          <p className="text-xl font-extrabold text-terracota-600">
            {pesos(inmueble.precio)}
            <span className="text-sm font-medium text-piedra-600"> / mes</span>
          </p>

          <h3 className="line-clamp-2 text-base leading-snug font-bold text-piedra-900">
            {inmueble.titulo}
          </h3>

          <p className="text-sm text-piedra-600">
            {inmueble.barrio} · {distancia(inmueble.distanciaUniversidadKm)}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="chip">
              {inmueble.habitaciones} {inmueble.habitaciones === 1 ? 'habitacion' : 'habitaciones'}
            </span>
            <span className="chip">
              {inmueble.banos} {inmueble.banos === 1 ? 'bano' : 'banos'}
            </span>
            {inmueble.amoblado && <span className="chip">Amoblado</span>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="truncate text-xs text-piedra-600">{inmueble.arrendador.nombre}</span>
            <Estrellas
              valor={inmueble.arrendador.calificacionPromedio}
              total={inmueble.arrendador.totalResenas}
            />
          </div>
        </div>
      </Link>

      {comparable && (
        <div className="border-t border-piedra-200 px-4 py-2">
          <label
            className={`flex items-center gap-2 text-sm font-medium ${
              !marcado && estaLleno ? 'text-piedra-400' : 'text-piedra-800'
            }`}
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-piedra-200 text-confianza-500 focus:ring-confianza-500"
              checked={marcado}
              disabled={!marcado && estaLleno}
              onChange={() => alternar(inmueble.id)}
            />
            {marcado ? 'Se va a comparar' : estaLleno ? 'Ya elegiste tres' : 'Comparar'}
          </label>
        </div>
      )}

      {accion && <div className="border-t border-piedra-200 p-3">{accion}</div>}
    </article>
  );
}
