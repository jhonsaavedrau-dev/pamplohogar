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
      <section className="border-b border-piedra-200 bg-gradient-to-b from-terracota-50 to-piedra-50">
        <div className="contenedor-app py-10 sm:py-14">
          <h1 className="max-w-2xl text-3xl leading-tight font-extrabold text-piedra-900 sm:text-4xl">
            Encuentra donde vivir en Pamplona sin depender del voz a voz
          </h1>
          <p className="mt-3 max-w-xl text-base text-piedra-600">
            Habitaciones, apartaestudios y apartamentos publicados por arrendadores de la ciudad,
            con precios a la vista y ubicacion en el mapa.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              className="campo flex-1"
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
                <input
                  id="filtro-barrio"
                  type="text"
                  className="campo"
                  placeholder="Ej: Centro"
                  value={valor('barrio')}
                  onChange={(e) => actualizar('barrio', e.target.value)}
                />
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
