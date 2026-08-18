import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pedir } from '../lib/api';
import { fechaCorta } from '../lib/formato';
import { fotoDeAncho } from '../lib/fotos';
import { Cargando, EstadoError, EstadoVacio } from '../components/Estados';
import { Avatar } from '../components/Avatar';
import type { ResumenConversacion } from '../lib/tipos';

/**
 * Cada cuanto se vuelve a preguntar por mensajes nuevos.
 *
 * No se usa una conexion permanente a proposito: el servidor gratuito se
 * duerme y se despierta, y una conexion abierta se caeria a cada rato sin que
 * nadie se entere. Preguntar cada pocos segundos es menos elegante pero no se
 * rompe, y para quien esta escribiendo se siente igual.
 */
export const SEGUNDOS_ENTRE_REVISIONES = 8;

export function Mensajes() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => pedir<{ conversaciones: ResumenConversacion[] }>('/api/conversaciones'),
    refetchInterval: SEGUNDOS_ENTRE_REVISIONES * 1000,
  });

  if (isPending) return <Cargando texto="Cargando tus mensajes..." />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar tus mensajes.'}
          alReintentar={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-piedra-900">Mensajes</h1>
        <p className="mt-1 text-piedra-600">
          Aquí queda escrito lo que acordaste, sin dar tu número si no quieres.
        </p>
      </div>

      {data.conversaciones.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tienes conversaciones"
          descripcion="Cuando escribas a un arrendador desde una publicación, o alguien te escriba a ti, la conversación aparece aquí."
        />
      ) : (
        <ul className="space-y-2">
          {data.conversaciones.map((c) => (
            <li key={c.id}>
              <Link
                to={`/mensajes/${c.id}`}
                className="tarjeta flex items-center gap-3 p-3 transition-colors hover:bg-piedra-50"
              >
                {/*
                  La foto del inmueble con la cara de la persona encima. La
                  bandeja se lee por dos cosas: de que inmueble se hablaba y
                  con quien. Antes solo salia el inmueble, y con tres hilos del
                  mismo edificio no habia forma de distinguirlos de un vistazo.
                */}
                <div className="relative shrink-0">
                  {c.foto !== null ? (
                    <img
                      src={fotoDeAncho(c.foto, 160)}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-piedra-100" />
                  )}
                  <Avatar
                    nombre={c.con}
                    foto={c.conFoto}
                    tamano={26}
                    className="absolute -right-1.5 -bottom-1.5 ring-2 ring-white"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="truncate text-piedra-900">{c.con}</strong>
                    <span className="shrink-0 text-xs text-piedra-400">
                      {fechaCorta(c.ultimoEn)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-piedra-600">{c.inmuebleTitulo}</p>
                  <p className="truncate text-sm text-piedra-800">
                    {c.ultimoMensaje ?? 'Sin mensajes todavía'}
                  </p>
                </div>

                {c.sinLeer > 0 && (
                  <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-terracota-600 px-1.5 text-xs font-bold text-white">
                    {c.sinLeer}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
