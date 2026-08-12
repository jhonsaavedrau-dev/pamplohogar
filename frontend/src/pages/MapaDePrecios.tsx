import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pedir } from '../lib/api';
import { pesos } from '../lib/formato';
import { Cargando, EstadoError, EstadoVacio } from '../components/Estados';
import { ETIQUETAS_TIPO, PLURAL_TIPO } from '../lib/tipos';
import type { MapaDePrecios as Datos, NivelDePrecio, TipoInmueble } from '../lib/tipos';

const MapaDeCalor = lazy(() =>
  import('../components/MapaDeCalor').then((m) => ({ default: m.MapaDeCalor })),
);

const TIPOS: TipoInmueble[] = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'];

const COLORES: Record<NivelDePrecio, string> = {
  barato: 'bg-verificado-600',
  normal: 'bg-confianza-500',
  caro: 'bg-terracota-500',
};

const NOMBRES: Record<NivelDePrecio, string> = {
  barato: 'Más barato de lo normal',
  normal: 'En lo normal',
  caro: 'Más caro de lo normal',
};

export function MapaDePrecios() {
  const [tipo, setTipo] = useState<TipoInmueble>('HABITACION');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['mapaDePrecios', tipo],
    queryFn: () => pedir<Datos>(`/api/inmuebles/mapa-de-precios?tipo=${tipo}`),
  });

  const plural = PLURAL_TIPO[tipo];

  /**
   * Con menos de cuatro publicaciones en toda la ciudad no hay "precio
   * tipico" que valga. Decirlo igual seria darle a una sola publicacion el
   * peso de un dato de ciudad.
   */
  const hayConQueComparar = data !== undefined && data.puntos.length >= 4;
  const todasNormales = data !== undefined && data.zonas.every((z) => z.nivel === 'normal');

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-piedra-900">Mapa de precios de Pamplona</h1>
        <p className="mt-1 text-piedra-600">
          Dónde se cobra más y dónde menos, para escoger el barrio antes de enamorarse de una foto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`inline-flex min-h-12 items-center rounded-full px-5 text-base font-semibold transition-colors ${
              t === tipo
                ? 'bg-terracota-600 text-white'
                : 'bg-piedra-100 text-piedra-700 hover:bg-piedra-200'
            }`}
          >
            {ETIQUETAS_TIPO[t]}
          </button>
        ))}
      </div>

      {isPending && <Cargando texto="Calculando los precios por zona..." />}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar el mapa.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data && data.puntos.length === 0 && (
        <EstadoVacio
          titulo={`Todavía no hay ${plural.nombre} ${plural.final}`}
          descripcion="Cuando haya publicaciones de este tipo, aquí vas a ver en qué zonas se cobra más y en cuáles menos."
        />
      )}

      {data && data.puntos.length > 0 && (
        <>
          <p className="rounded-xl bg-piedra-100 px-4 py-3 text-sm text-piedra-700">
            {hayConQueComparar ? (
              <>
                En toda Pamplona, la mitad de {plural.articulo} {plural.nombre} cuesta menos de{' '}
                <strong>{pesos(data.medianaDeLaCiudad)}</strong>. Los colores comparan cada zona
                contra esa cifra.
              </>
            ) : (
              <>
                Por ahora solo hay {data.puntos.length}{' '}
                {data.puntos.length === 1 ? ETIQUETAS_TIPO[tipo].toLowerCase() : plural.nombre} en
                toda la ciudad, muy poco para hablar de un precio típico. En el mapa{' '}
                {data.puntos.length === 1
                  ? 'aparece esa publicación'
                  : 'aparecen esas publicaciones, una por una'}
                .
              </>
            )}
          </p>

          <Suspense
            fallback={
              <div className="grid h-[26rem] animate-pulse place-items-center rounded-2xl border border-piedra-200 bg-piedra-100 text-sm text-piedra-400">
                Cargando el mapa...
              </div>
            }
          >
            <MapaDeCalor datos={data} />
          </Suspense>

          {hayConQueComparar && (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-piedra-700">
                {(['barato', 'normal', 'caro'] as NivelDePrecio[]).map((n) => (
                  <span key={n} className="inline-flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${COLORES[n]}`} aria-hidden="true" />
                    {NOMBRES[n]}
                  </span>
                ))}
              </div>

              <p className="text-sm text-piedra-600">
                Los círculos grandes son zonas con varias publicaciones y crecen según cuántas haya.
                Los puntos pequeños son publicaciones sueltas: cada uno es un precio real, no un
                promedio.
              </p>
            </>
          )}

          {data.zonas.length > 0 ? (
            <section>
              <h2 className="mb-2 text-lg font-bold text-piedra-900">
                Zonas con datos suficientes
              </h2>
              <ul className="space-y-2">
                {data.zonas.map((z) => (
                  <li
                    key={z.barrio}
                    className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <strong className="text-piedra-900">{z.barrio}</strong>
                      <p className="text-sm text-piedra-600">
                        {z.inmuebles} {z.inmuebles === 1 ? 'publicación' : 'publicaciones'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-piedra-900">{pesos(z.mediana)}</p>
                      <p className="text-sm text-piedra-600">
                        {z.diferenciaPorcentaje === 0
                          ? 'igual que la ciudad'
                          : `${Math.abs(z.diferenciaPorcentaje)}% ${
                              z.diferenciaPorcentaje > 0 ? 'por encima' : 'por debajo'
                            }`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {todasNormales && (
                <p className="mt-3 rounded-xl bg-confianza-50 px-4 py-3 text-sm text-piedra-700">
                  Por ahora ninguna zona se sale de lo normal: los precios se parecen bastante en
                  toda la ciudad. Si es así, no vale la pena escoger barrio por plata. Mira mejor{' '}
                  <strong>cuánto vas a caminar</strong> y lo que cuentan los que ya vivieron ahí
                  sobre ruido y seguridad, que eso sí cambia mucho de un barrio a otro.
                </p>
              )}
            </section>
          ) : (
            hayConQueComparar && (
              <p className="rounded-xl bg-piedra-100 px-4 py-3 text-sm text-piedra-700">
                Todavía ningún barrio tiene {data.minimoPorBarrio} publicaciones de este tipo, que
                es el mínimo para decir cómo son sus precios. Por ahora el mapa muestra las
                publicaciones una por una.
              </p>
            )
          )}

          {data.barriosConPocosDatos.length > 0 && (
            <p className="text-sm text-piedra-600">
              Con muy pocas publicaciones para sacar un precio de zona:{' '}
              {data.barriosConPocosDatos.join(', ')}.
            </p>
          )}

          <Link to="/" className="boton-suave inline-flex">
            Ver las publicaciones
          </Link>
        </>
      )}
    </div>
  );
}
