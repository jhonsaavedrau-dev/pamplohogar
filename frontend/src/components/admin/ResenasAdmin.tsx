import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import type { ResenaAdmin, ResenaBarrioAdmin } from '../../lib/tipos';
import { fechaCorta } from '../../lib/formato';
import { Estrellas } from '../Estrellas';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../Estados';

const ASPECTOS = [
  ['tranquilidad', 'Tranquilidad'],
  ['seguridad', 'Seguridad'],
  ['transporte', 'Transporte'],
] as const;

/** Las opiniones sobre barrios se moderan igual que las de arrendadores. */
function OpinionesDeBarrio() {
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'resenasBarrio'],
    queryFn: () => pedir<{ resenas: ResenaBarrioAdmin[] }>('/api/admin/resenas-barrio'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => pedir(`/api/barrios/resenas/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      setMensaje('Opinión retirada.');
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos retirarla.'),
  });

  if (isPending) return <Cargando texto="Cargando opiniones de barrio..." />;
  if (isError || !data) return null;

  return (
    <section className="border-t border-piedra-200 pt-6">
      <h3 className="font-bold text-piedra-900">Opiniones sobre barrios</h3>
      <p className="mb-3 mt-1 text-sm text-piedra-600">
        Las {data.resenas.length} mas recientes. Retira las que señalen a una persona o inventen.
      </p>

      {mensaje && (
        <div className="mb-3">
          <Aviso tipo={eliminar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>
        </div>
      )}

      {data.resenas.length === 0 ? (
        <EstadoVacio
          titulo="Todavia nadie ha opinado de un barrio"
          descripcion="Cuando los estudiantes cuenten como es vivir en cada zona, aparecera aquí para moderarlo."
        />
      ) : (
        <ul className="space-y-3">
          {data.resenas.map((r) => (
            <li key={r.id} className="tarjeta p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-piedra-900">{r.barrio}</strong>
                    <span className="text-xs text-piedra-400">{fechaCorta(r.creadoEn)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-piedra-600">
                    {ASPECTOS.map(([campo, titulo]) => (
                      <span key={campo}>
                        {titulo} <strong className="text-piedra-900">{r[campo]}</strong>/5
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-piedra-800">{r.comentario}</p>
                  <p className="mt-2 text-xs text-piedra-600">
                    Escrita por <strong className="text-piedra-800">{r.autor}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="boton-suave shrink-0 text-sm text-terracota-700"
                  disabled={eliminar.isPending}
                  onClick={() => {
                    if (window.confirm('Retirar esta opinión? No se puede deshacer.')) {
                      eliminar.mutate(r.id);
                    }
                  }}
                >
                  Retirar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ResenasAdmin() {
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'resenas'],
    queryFn: () => pedir<{ resenas: ResenaAdmin[] }>('/api/admin/resenas'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => pedir(`/api/resenas/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      setMensaje('Reseña retirada.');
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos retirarla.'),
  });

  if (isLoading) return <Cargando texto="Cargando reseñas..." />;
  if (isError || !data) {
    return (
      <EstadoError
        mensaje={error instanceof Error ? error.message : 'No pudimos cargar las reseñas.'}
        alReintentar={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {mensaje && <Aviso tipo={eliminar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>}

      <div>
        <h3 className="font-bold text-piedra-900">Reseñas de arrendadores</h3>
        <p className="mt-1 text-sm text-piedra-600">
          Las {data.resenas.length} mas recientes. Retira las que insulten o mientan.
        </p>
      </div>

      {data.resenas.length === 0 ? (
        <EstadoVacio
          titulo="Todavia no hay reseñas"
          descripcion="Cuando los estudiantes empiecen a calificar arrendadores, apareceran aquí para moderarlas."
        />
      ) : (
        <ul className="space-y-3">
          {data.resenas.map((r) => (
            <li key={r.id} className="tarjeta p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Estrellas valor={r.calificacion} />
                    <span className="text-xs text-piedra-400">{fechaCorta(r.creadoEn)}</span>
                  </div>
                  <p className="mt-2 text-sm text-piedra-800">{r.comentario}</p>
                  <p className="mt-2 text-xs text-piedra-600">
                    <strong className="text-piedra-800">{r.autor}</strong> calificando a{' '}
                    <strong className="text-piedra-800">{r.sobre}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="boton-suave shrink-0 text-sm text-terracota-700"
                  disabled={eliminar.isPending}
                  onClick={() => {
                    if (window.confirm('Retirar esta reseña? No se puede deshacer.')) {
                      eliminar.mutate(r.id);
                    }
                  }}
                >
                  Retirar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <OpinionesDeBarrio />
    </div>
  );
}
