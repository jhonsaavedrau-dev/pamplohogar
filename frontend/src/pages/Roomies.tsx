import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { useRevelarAlEntrar } from '../lib/revelar';
import type { RespuestaRoomies, RitmoDeVida } from '../lib/tiposRoomie';
import { ETIQUETAS_RITMO } from '../lib/tiposRoomie';
import { TarjetaRoomie } from '../components/TarjetaRoomie';
import { EstadoError, EstadoVacio, TarjetaFantasma } from '../components/Estados';

const RITMOS: RitmoDeVida[] = ['MADRUGADOR', 'NOCTURNO', 'MIXTO'];

export function Roomies() {
  const [parametros, setParametros] = useSearchParams();
  const { usuario } = useSesion();

  const valor = (clave: string) => parametros.get(clave) ?? '';

  const actualizar = (clave: string, nuevo: string) => {
    const copia = new URLSearchParams(parametros);
    if (nuevo === '') copia.delete(clave);
    else copia.set(clave, nuevo);
    copia.delete('pagina');
    setParametros(copia, { replace: true });
  };

  const consulta = parametros.toString();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['roomies', consulta],
    queryFn: () => pedir<RespuestaRoomies>(`/api/roomies?${consulta}`),
  });

  useRevelarAlEntrar(data?.perfiles);

  const hayFiltros = Array.from(parametros.keys()).filter((k) => k !== 'pagina').length > 0;

  return (
    <>
      <section className="border-b border-piedra-200 bg-gradient-to-b from-confianza-50 to-piedra-50">
        <div className="contenedor-app py-10 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
          <div>
            <h1 className="max-w-2xl text-[2rem] leading-[1.1] font-semibold tracking-tight text-piedra-900 sm:text-[2.75rem]">
              Entre varios, el arriendo cuesta la mitad
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-piedra-600">
              Un apartamento de 850 mil entre tres sale a 283 mil por cabeza, más barato que casi
              cualquier habitación sola. Aquí encuentras con quién.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/roomies/mi-perfil" className="boton-primario">
                {data?.tengoPerfil ? 'Editar mi perfil' : 'Crear mi perfil'}
              </Link>
              <Link to="/" className="boton-suave">
                Ver inmuebles
              </Link>
            </div>

            {!usuario && (
              <p className="mt-4 text-sm text-piedra-600">
                Necesitas una cuenta para publicar tu perfil o escribirle a alguien.
              </p>
            )}
          </div>

          {/* Compartir no es una idea abstracta: es una cocina con dos tazas.
              Solo en computador, donde la mitad derecha quedaba en blanco; en
              celular ni se descarga. */}
          <div
            aria-hidden="true"
            className="hidden aspect-[4/5] rounded-t-[999px] rounded-b-3xl shadow-[0_30px_60px_-30px_rgba(31,59,75,0.4)] ring-1 ring-confianza-700/10 lg:block lg:bg-[url('/fotos/cocina-compartida.webp')] lg:bg-cover lg:bg-center"
          />
        </div>
      </section>

      <div className="contenedor-app py-8">
        <h2 className="sr-only">Estudiantes que buscan roomie</h2>

        <div className="tarjeta mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="etiqueta" htmlFor="roomie-presupuesto">
              Puede poner hasta
            </label>
            <input
              id="roomie-presupuesto"
              type="number"
              inputMode="numeric"
              min={0}
              step={50000}
              className="campo"
              placeholder="400000"
              value={valor('presupuestoMax')}
              onChange={(e) => actualizar('presupuestoMax', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="roomie-zona">
              Zona que le sirve
            </label>
            <input
              id="roomie-zona"
              className="campo"
              placeholder="El Buque"
              value={valor('zona')}
              onChange={(e) => actualizar('zona', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="roomie-ritmo">
              Ritmo de vida
            </label>
            <select
              id="roomie-ritmo"
              className="campo"
              value={valor('ritmo')}
              onChange={(e) => actualizar('ritmo', e.target.value)}
            >
              <option value="">Cualquiera</option>
              {RITMOS.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETAS_RITMO[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-piedra-800">
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
                checked={valor('sinFumadores') === 'true'}
                onChange={(e) => actualizar('sinFumadores', e.target.checked ? 'true' : '')}
              />
              Solo no fumadores
            </label>
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-piedra-800">
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
                checked={valor('aceptaMascotas') === 'true'}
                onChange={(e) => actualizar('aceptaMascotas', e.target.checked ? 'true' : '')}
              />
              Acepta mascotas
            </label>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <TarjetaFantasma key={i} />
            ))}
          </div>
        )}

        {isError && (
          <EstadoError
            mensaje={error instanceof Error ? error.message : 'No pudimos cargar los perfiles.'}
            alReintentar={() => void refetch()}
          />
        )}

        {data && (
          <>
            <p className="mb-5 text-sm text-piedra-600">
              <strong className="font-semibold text-piedra-900">
                {data.total === 0
                  ? 'Nadie por ahora'
                  : `${data.total} ${data.total === 1 ? 'persona busca' : 'personas buscan'} roomie`}
              </strong>
            </p>

            {data.perfiles.length === 0 ? (
              <EstadoVacio
                titulo={hayFiltros ? 'Nadie encaja con esos filtros' : 'Todavía no hay nadie aquí'}
                foto={hayFiltros ? undefined : '/fotos/sala-compartida.webp'}
                descripcion={
                  hayFiltros
                    ? 'Prueba subiendo el presupuesto o quitando algún filtro.'
                    : 'Sé el primero en publicar tu perfil. Cuando otro estudiante entre buscando con quién compartir, te va a encontrar.'
                }
                accion={
                  hayFiltros ? (
                    <button
                      type="button"
                      onClick={() => setParametros(new URLSearchParams(), { replace: true })}
                      className="boton-primario mt-2"
                    >
                      Ver a todos
                    </button>
                  ) : (
                    <Link to="/roomies/mi-perfil" className="boton-primario mt-2">
                      Publicar mi perfil
                    </Link>
                  )
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.perfiles.map((p) => (
                  <TarjetaRoomie key={p.id} perfil={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
