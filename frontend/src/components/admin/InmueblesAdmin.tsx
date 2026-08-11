import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import type { InmuebleAdmin } from '../../lib/tipos';
import { ETIQUETAS_TIPO } from '../../lib/tipos';
import { fechaCorta, pesos } from '../../lib/formato';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../Estados';

interface Respuesta {
  total: number;
  pagina: number;
  totalPaginas: number;
  medianaPrecios: number;
  inmuebles: InmuebleAdmin[];
}

const ESTADOS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Publicados' },
  { valor: 'ocultos', etiqueta: 'Ocultos' },
] as const;

export function InmueblesAdmin() {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<'todos' | 'activos' | 'ocultos'>('todos');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const parametros = new URLSearchParams({ estado, pagina: String(pagina) });
  if (busqueda.trim() !== '') parametros.set('q', busqueda.trim());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'inmuebles', parametros.toString()],
    queryFn: () => pedir<Respuesta>(`/api/admin/inmuebles?${parametros.toString()}`),
  });

  const refrescar = () => {
    void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
  };

  const alternar = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      pedir(`/api/inmuebles/${id}`, { metodo: 'PATCH', cuerpo: { activo } }),
    onSuccess: (_r, variables) => {
      setMensaje(variables.activo ? 'Inmueble visible otra vez.' : 'Inmueble retirado del listado.');
      refrescar();
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos cambiarlo.'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => pedir(`/api/inmuebles/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      setMensaje('Inmueble eliminado para siempre.');
      refrescar();
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos eliminarlo.'),
  });

  const cambiarFiltro = (nuevo: typeof estado) => {
    setEstado(nuevo);
    setPagina(1);
  };

  return (
    <div className="space-y-4">
      {mensaje && (
        <Aviso tipo={alternar.isError || eliminar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          className="campo flex-1"
          placeholder="Busca por titulo, barrio, arrendador o correo"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          aria-label="Buscar inmuebles"
        />
        <div className="flex gap-2">
          {ESTADOS.map((e) => (
            <button
              key={e.valor}
              type="button"
              onClick={() => cambiarFiltro(e.valor)}
              aria-pressed={estado === e.valor}
              className={`min-h-12 flex-1 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                estado === e.valor
                  ? 'border-confianza-500 bg-confianza-500 text-white'
                  : 'border-piedra-200 bg-white text-piedra-800'
              }`}
            >
              {e.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Cargando texto="Buscando inmuebles..." />}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar los inmuebles.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data && (
        <>
          <p className="text-sm text-piedra-600">
            {data.total} {data.total === 1 ? 'inmueble' : 'inmuebles'}
            {data.medianaPrecios > 0 && (
              <span className="text-piedra-400">
                {' '}
                · el precio tipico de la ciudad es {pesos(data.medianaPrecios)}
              </span>
            )}
          </p>

          {data.inmuebles.length === 0 ? (
            <EstadoVacio
              titulo="Nada por aqui"
              descripcion="Con esa busqueda y ese filtro no hay inmuebles. Prueba cambiando alguno."
            />
          ) : (
            <ul className="space-y-3">
              {data.inmuebles.map((i) => (
                <li key={i.id} className="tarjeta p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip">{ETIQUETAS_TIPO[i.tipo]}</span>
                        {!i.activo && (
                          <span className="rounded-full bg-piedra-800 px-3 py-1 text-xs font-bold text-white">
                            Oculto
                          </span>
                        )}
                        {i.fotos === 0 && (
                          <span className="rounded-full bg-terracota-100 px-3 py-1 text-xs font-bold text-terracota-700">
                            Sin fotos
                          </span>
                        )}
                        {i.precioInusual && (
                          <span className="rounded-full bg-terracota-100 px-3 py-1 text-xs font-bold text-terracota-700">
                            Precio raro
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/inmueble/${i.id}`}
                        className="mt-2 block font-bold text-piedra-900 hover:text-terracota-600"
                      >
                        {i.titulo}
                      </Link>

                      <p className="mt-1 text-sm text-piedra-600">
                        {pesos(i.precio)} · {i.barrio} · {fechaCorta(i.creadoEn)}
                      </p>

                      <p className="mt-1 text-sm text-piedra-600">
                        Publicado por <strong className="text-piedra-800">{i.arrendador.nombre}</strong>{' '}
                        <span className="text-piedra-400">({i.arrendador.email})</span>
                      </p>

                      <p className="mt-1 text-xs text-piedra-600">
                        {i.fotos} {i.fotos === 1 ? 'foto' : 'fotos'} · {i.solicitudes}{' '}
                        {i.solicitudes === 1 ? 'contacto' : 'contactos'} · {i.favoritos}{' '}
                        {i.favoritos === 1 ? 'favorito' : 'favoritos'}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="boton-suave flex-1 text-sm lg:flex-none"
                        disabled={alternar.isPending}
                        onClick={() => alternar.mutate({ id: i.id, activo: !i.activo })}
                      >
                        {i.activo ? 'Retirar' : 'Volver a publicar'}
                      </button>
                      <button
                        type="button"
                        className="boton-suave flex-1 text-sm text-terracota-700 lg:flex-none"
                        disabled={eliminar.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Eliminar "${i.titulo}" para siempre? Esto no se puede deshacer.`,
                            )
                          ) {
                            eliminar.mutate(i.id);
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="boton-suave"
                disabled={data.pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
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
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
