import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import type { RespuestaListado, TipoInmueble } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO, SERVICIOS_DISPONIBLES } from '../lib/tipos';
import { TarjetaInmueble } from '../components/TarjetaInmueble';
import { EstadoError, EstadoVacio, TarjetaFantasma } from '../components/Estados';
import { pesos } from '../lib/formato';

const TIPOS: TipoInmueble[] = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'];

const ORDENES = [
  { valor: 'recientes', etiqueta: 'Mas recientes' },
  { valor: 'precioAsc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precioDesc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'cercania', etiqueta: 'Mas cerca de la U' },
] as const;

/** Patron de tejas que evoca las fachadas del centro historico de Pamplona. */
function TejasDeFondo() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-terracota-400/25"
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
      <section className="relative overflow-hidden border-b border-terracota-100 bg-gradient-to-b from-terracota-100 via-terracota-50 to-piedra-50">
        <TejasDeFondo />

        <div className="contenedor-app relative py-10 sm:py-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold tracking-wide text-terracota-700 uppercase">
            Pamplona, Norte de Santander
          </p>

          <h1 className="max-w-2xl text-[2rem] leading-[1.1] font-extrabold tracking-tight text-piedra-900 sm:text-5xl">
            Encuentra donde vivir
            <span className="block text-terracota-600">sin depender del voz a voz</span>
          </h1>

          <p className="mt-4 max-w-lg text-base text-piedra-600 sm:text-lg">
            Habitaciones, apartaestudios y apartamentos de arrendadores de la ciudad. Con el precio
            de frente, la ubicacion en el mapa y lo que opinan otros estudiantes.
          </p>

          <div className="mt-7 rounded-2xl border border-piedra-200 bg-white p-3 shadow-[0_8px_30px_rgba(210,105,30,0.12)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                className="campo flex-1 border-transparent bg-piedra-50"
                placeholder="Busca por barrio, zona o palabra clave"
                value={valor('q')}
                onChange={(e) => actualizar('q', e.target.value)}
                aria-label="Buscar vivienda"
              />
              <button
                type="button"
                onClick={() => setFiltrosAbiertos((v) => !v)}
                className="boton-confianza"
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

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-piedra-600">
            {[
              'Precios a la vista, sin sorpresas',
              'El celular del arrendador queda protegido',
              'Resenas de estudiantes que ya vivieron ahi',
            ].map((texto) => (
              <li key={texto} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-terracota-500">
                  ✓
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="contenedor-app py-6">
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
                  Habitaciones (minimo)
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
                      className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
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

            <label className="flex items-center gap-3 text-base font-medium text-piedra-800">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-piedra-200 text-terracota-500 focus:ring-terracota-500"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="mb-4 text-sm text-piedra-600">
              {data.total === 0
                ? 'Sin resultados'
                : `${data.total} ${data.total === 1 ? 'inmueble disponible' : 'inmuebles disponibles'}`}
              {valor('precioMax') && ` hasta ${pesos(Number(valor('precioMax')))}`}
            </p>

            {data.inmuebles.length === 0 ? (
              <EstadoVacio
                titulo="No encontramos nada con esos filtros"
                descripcion="Prueba subiendo el precio maximo, quitando algun servicio o buscando en otro barrio."
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.inmuebles.map((inmueble) => (
                  <TarjetaInmueble key={inmueble.id} inmueble={inmueble} />
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
