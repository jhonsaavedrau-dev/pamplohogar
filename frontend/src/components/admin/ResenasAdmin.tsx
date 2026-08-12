import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import type { ResenaAdmin } from '../../lib/tipos';
import { fechaCorta } from '../../lib/formato';
import { Estrellas } from '../Estrellas';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../Estados';

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

      <p className="text-sm text-piedra-600">
        Las {data.resenas.length} mas recientes. Retira las que insulten o mientan.
      </p>

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
    </div>
  );
}
