import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import type { Inmueble } from '../lib/tipos';
import { TarjetaInmueble } from '../components/TarjetaInmueble';
import { EstadoError, EstadoVacio, TarjetaFantasma } from '../components/Estados';

export function MisInmuebles() {
  const clienteQuery = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['mis-inmuebles'],
    queryFn: () => pedir<{ inmuebles: Inmueble[] }>('/api/inmuebles/mios'),
  });

  const alternarVisibilidad = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      pedir(`/api/inmuebles/${id}`, { metodo: 'PATCH', cuerpo: { activo } }),
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['mis-inmuebles'] });
      void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
    },
  });

  return (
    <div className="contenedor-app py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-piedra-900">Mis inmuebles</h1>
          <p className="mt-1 text-sm text-piedra-600">
            Gestiona lo que tienes publicado en PamploHogar.
          </p>
        </div>
        <Link to="/publicar" className="boton-primario">
          Publicar inmueble
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <TarjetaFantasma key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar tus inmuebles.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data &&
        (data.inmuebles.length === 0 ? (
          <EstadoVacio
            titulo="Aun no has publicado nada"
            descripcion="Publica tu primera habitacion o apartamento. Toma menos de cinco minutos y los estudiantes te encuentran de una."
            accion={
              <Link to="/publicar" className="boton-primario mt-2">
                Publicar mi primer inmueble
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.inmuebles.map((inmueble) => (
              <TarjetaInmueble
                key={inmueble.id}
                inmueble={inmueble}
                accion={
                  <div className="flex gap-2">
                    <Link
                      to={`/inmueble/${inmueble.id}/editar`}
                      className="boton-suave flex-1 text-sm"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="boton-suave flex-1 text-sm"
                      disabled={alternarVisibilidad.isPending}
                      onClick={() =>
                        alternarVisibilidad.mutate({ id: inmueble.id, activo: !inmueble.activo })
                      }
                    >
                      {inmueble.activo ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        ))}
    </div>
  );
}
