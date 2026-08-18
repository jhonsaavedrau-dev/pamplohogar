import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import type { RespuestaListado, TipoInmueble } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO, SERVICIOS_DISPONIBLES } from '../lib/tipos';
import { TarjetaInmueble } from '../components/TarjetaInmueble';
import { useRevelarAlEntrar } from '../lib/revelar';
import { GuardarBusqueda } from '../components/GuardarBusqueda';
import { EstadoError, EstadoVacio, TarjetaFantasma } from '../components/Estados';
import { pesos } from '../lib/formato';

const TIPOS: TipoInmueble[] = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'];

const ORDENES = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'precioAsc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precioDesc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'cercania', etiqueta: 'Más cerca de la U' },
] as const;

/*
  El valle donde esta Pamplona, cerrando la portada.

  Pamplona esta metida entre montanas y eso lo sabe cualquiera que haya
  estudiado alli: son las que se ven desde la ventana de cualquier habitacion
  que se arriende. Las tres capas van de mas clara a mas oscura para dar
  distancia, y la ultima remata contra el color de fondo del listado, asi que
  la portada no termina en un corte recto sino en el horizonte de la ciudad.

  Es decoracion, no informacion: por eso no la lee el lector de pantalla.
*/
function MontanasDeFondo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full sm:h-32"
    >
      <path
        d="M0 96 180 48l150 38 170-58 190 62 160-40 200 54 190-36 180 44v96H0Z"
        className="fill-terracota-100/45"
      />
      <path
        d="M0 122 210 78l160 34 200-44 180 48 210-30 240 44 240-26v92H0Z"
        className="fill-terracota-200/40"
      />
      <path
        d="M0 148 240 116l220 22 210-30 260 34 250-24 260 26v56H0Z"
        className="fill-piedra-50"
      />
    </svg>
  );
}

/** Patron de tejas que evoca las fachadas del centro historico de Pamplona. */
function TejasDeFondo() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-56 w-full text-terracota-400/20"
    >
      <defs>
        <pattern id="tejas" width="36" height="18" patternUnits="userSpaceOnUse">
          <path
            d="M0 18C0 8 8 0 18 0s18 8 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </pattern>
        <linearGradient id="desvanecer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="mascara-tejas">
          <rect width="100%" height="100%" fill="url(#desvanecer)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#tejas)" mask="url(#mascara-tejas)" />
    </svg>
  );
}

export function Buscar() {
  const [parametros, setParametros] = useSearchParams();
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const valor = (clave: string) => parametros.get(clave) ?? '';

  const actualizar = (clave: string, nuevo: string) => {
    const copia = new URLSearchParams(parametros);
    if (nuevo === '') copia.delete(clave);
    else copia.set(clave, nuevo);
    copia.delete('pagina');
    setParametros(copia, { replace: true });
  };

  const alternarServicio = (servicio: string) => {
    const actuales = valor('servicios').split(',').filter(Boolean);
    const nuevos = actuales.includes(servicio)
      ? actuales.filter((s) => s !== servicio)
      : [...actuales, servicio];
    actualizar('servicios', nuevos.join(','));
  };

  const limpiar = () => setParametros(new URLSearchParams(), { replace: true });

  const consulta = parametros.toString();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inmuebles', consulta],
    queryFn: () => pedir<RespuestaListado>(`/api/inmuebles?${consulta}`),
  });

  useRevelarAlEntrar(data?.inmuebles);

  const { data: barrios } = useQuery({
    queryKey: ['barrios'],
    queryFn: () => pedir<{ barrios: string[] }>('/api/inmuebles/barrios'),
    staleTime: 5 * 60_000,
  });

  const serviciosActivos = valor('servicios').split(',').filter(Boolean);
  const hayFiltros = Array.from(parametros.keys()).filter((k) => k !== 'pagina').length > 0;

  const irAPagina = (pagina: number) => {
    const copia = new URLSearchParams(parametros);
    copia.set('pagina', String(pagina));
    setParametros(copia);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="con-grano relative overflow-hidden bg-gradient-to-b from-terracota-50 via-terracota-50/40 to-piedra-50">
        <TejasDeFondo />
        <MontanasDeFondo />

        {/* El encabezado es fijo y tapaba la etiqueta de arriba: por eso el
            espacio superior es grande. Y el de abajo tiene que dejar libres las
            montanas, que son de alto fijo y van pegadas al fondo. */}
        <div className="contenedor-app relative pt-14 pb-32 sm:pt-20 sm:pb-44">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-terracota-200/70 bg-white/70 px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.08em] text-terracota-700 uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-terracota-500" aria-hidden="true" />
            Pamplona, Norte de Santander
          </p>

          <h1 className="max-w-3xl text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.02em] text-piedra-900 sm:text-[3.75rem]">
            Busca menos.{' '}
            <span className="block text-terracota-600">Elige mejor.</span>
          </h1>

          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-piedra-600 sm:text-lg">
            Encuentra habitaciones y apartamentos en Pamplona con información que sí te sirve.
          </p>

          <div className="mt-8 max-w-2xl rounded-2xl border border-piedra-200/80 bg-white p-2 shadow-[var(--shadow-elevada)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                className="campo flex-1 border-transparent bg-transparent text-[1.05rem] focus:ring-0"
                placeholder="Busca por barrio: Centro, El Buque, Cristo Rey..."
                value={valor('q')}
                onChange={(e) => actualizar('q', e.target.value)}
                aria-label="Buscar vivienda"
              />
              <button
                type="button"
                onClick={() => setFiltrosAbiertos((v) => !v)}
                className="boton-confianza shrink-0"
                aria-expanded={filtrosAbiertos}
              >
                {filtrosAbiertos ? 'Ocultar filtros' : 'Filtros'}
                {serviciosActivos.length > 0 && (
                  <span className="rounded-full bg-white/25 px-2 text-sm">
                    {serviciosActivos.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <ul className="mt-8 grid gap-x-8 gap-y-3 text-sm text-piedra-600 sm:grid-cols-3">
            {/*
              Lo que la plataforma de verdad hace, en las palabras del
              estudiante. Antes decia "el precio que ves es el que pagas", que
              es una promesa que no depende de nosotros: quien cobra es el
              arrendador. Prometer eso y que despues le cobren mas al estudiante
              es peor que no decir nada.
            */}
            {[
              'La distancia real hasta la universidad',
              'Si el precio se sale de lo normal del barrio',
              'Lo que cuentan los que ya vivieron ahí',
            ].map((texto) => (
              <li key={texto} className="flex items-start gap-2">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-4 w-4 shrink-0 text-terracota-500"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8.2 13.6 4.9 10.3l1.3-1.3 2 2 5.6-5.6 1.3 1.4z" />
                  <circle cx="10" cy="10" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="contenedor-app py-8">
        {/* Sin este titulo, quien usa lector de pantalla salta de H1 a H3
            y pierde de vista que aqui empiezan los resultados. */}
        <h2 className="sr-only">Inmuebles disponibles</h2>

        {filtrosAbiertos && (
          <div className="tarjeta mb-6 space-y-5 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta" htmlFor="filtro-tipo">
                  Tipo de inmueble
                </label>
                <select
                  id="filtro-tipo"
                  className="campo"
                  value={valor('tipo')}
                  onChange={(e) => actualizar('tipo', e.target.value)}
                >
                  <option value="">Todos</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETAS_TIPO[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="etiqueta" htmlFor="filtro-orden">
                  Ordenar por
                </label>
                <select
                  id="filtro-orden"
                  className="campo"
                  value={valor('orden') || 'recientes'}
                  onChange={(e) => actualizar('orden', e.target.value)}
                >
                  {ORDENES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="etiqueta" htmlFor="filtro-precio-min">
                  Precio desde
                </label>
                <input
                  id="filtro-precio-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50000}
                  className="campo"
                  placeholder="200000"
                  value={valor('precioMin')}
                  onChange={(e) => actualizar('precioMin', e.target.value)}
                />
              </div>

              <div>
                <label className="etiqueta" htmlFor="filtro-precio-max">
                  Precio hasta
                </label>
                <input
                  id="filtro-precio-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50000}
                  className="campo"
                  placeholder="800000"
                  value={valor('precioMax')}
                  onChange={(e) => actualizar('precioMax', e.target.value)}
                />
              </div>

              <div>
                <label className="etiqueta" htmlFor="filtro-barrio">
                  Barrio
                </label>
                <select
                  id="filtro-barrio"
                  className="campo"
                  value={valor('barrio')}
                  onChange={(e) => actualizar('barrio', e.target.value)}
                >
                  <option value="">Todos los barrios</option>
                  {(barrios?.barrios ?? []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="etiqueta" htmlFor="filtro-habitaciones">
                  Habitaciones (mínimo)
                </label>
                <input
                  id="filtro-habitaciones"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10}
                  className="campo"
                  value={valor('habitaciones')}
                  onChange={(e) => actualizar('habitaciones', e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="etiqueta">Servicios incluidos</p>
              <div className="flex flex-wrap gap-2">
                {SERVICIOS_DISPONIBLES.map((servicio) => {
                  const activo = serviciosActivos.includes(servicio);
                  return (
                    <button
                      key={servicio}
                      type="button"
                      onClick={() => alternarServicio(servicio)}
                      aria-pressed={activo}
                      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                        activo
                          ? 'border-terracota-500 bg-terracota-500 text-white'
                          : 'border-piedra-200 bg-white text-piedra-800'
                      }`}
                    >
                      {ETIQUETAS_SERVICIO[servicio]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex min-h-11 items-center gap-3 text-base font-medium text-piedra-800">
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 rounded border-piedra-200 text-terracota-500 focus:ring-terracota-500"
                checked={valor('amoblado') === 'true'}
                onChange={(e) => actualizar('amoblado', e.target.checked ? 'true' : '')}
              />
              Solo amoblados
            </label>

            {hayFiltros && (
              <button type="button" onClick={limpiar} className="boton-suave w-full sm:w-auto">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TarjetaFantasma key={i} />
            ))}
          </div>
        )}

        {isError && (
          <EstadoError
            mensaje={error instanceof Error ? error.message : 'No pudimos cargar los inmuebles.'}
            alReintentar={() => void refetch()}
          />
        )}

        {data && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-piedra-600">
              <strong className="font-semibold text-piedra-900">
                {data.total === 0
                  ? 'Sin resultados'
                  : `${data.total} ${data.total === 1 ? 'inmueble disponible' : 'inmuebles disponibles'}`}
              </strong>
                {valor('precioMax') && ` hasta ${pesos(Number(valor('precioMax')))}`}
              </p>
              <GuardarBusqueda />
            </div>

            {data.inmuebles.length === 0 ? (
              <EstadoVacio
                titulo="No encontramos nada con esos filtros"
                descripcion="Prueba subiendo el precio máximo, quitando algún servicio o buscando en otro barrio."
                accion={
                  hayFiltros ? (
                    <button type="button" onClick={limpiar} className="boton-primario mt-2">
                      Ver todos los inmuebles
                    </button>
                  ) : (
                    <Link to="/registro" className="boton-primario mt-2">
                      Publica el primero
                    </Link>
                  )
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.inmuebles.map((inmueble) => (
                  <TarjetaInmueble key={inmueble.id} inmueble={inmueble} conFavorito />
                ))}
              </div>
            )}

            {data.totalPaginas > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="boton-suave"
                  disabled={data.pagina <= 1}
                  onClick={() => irAPagina(data.pagina - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm text-piedra-600">
                  Pagina {data.pagina} de {data.totalPaginas}
                </span>
                <button
                  type="button"
                  className="boton-suave"
                  disabled={data.pagina >= data.totalPaginas}
                  onClick={() => irAPagina(data.pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
