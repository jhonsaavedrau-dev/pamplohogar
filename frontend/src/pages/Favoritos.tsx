import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import type { Inmueble } from '../lib/tipos';
import { TarjetaInmueble } from '../components/TarjetaInmueble';
import { EstadoError, EstadoVacio, TarjetaFantasma } from '../components/Estados';

export function Favoritos() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['favoritos'],
    queryFn: () => pedir<{ inmuebles: Inmueble[] }>('/api/favoritos'),
  });

  return (
    <div className="contenedor-app py-8">
      <h1 className="titular">Mis favoritos</h1>
      <p className="mt-1 mb-6 text-sm text-piedra-600">
        Los inmuebles que guardaste para revisarlos con calma.
      </p>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <TarjetaFantasma key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar tus favoritos.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data &&
        (data.inmuebles.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no has guardado nada"
            descripcion="Cuando veas un inmueble que te sirva, pulsa Guardar en favoritos y aparecera aquí."
            accion={
              <Link to="/" className="boton-primario mt-2">
                Buscar vivienda
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.inmuebles.map((inmueble) => (
              <TarjetaInmueble key={inmueble.id} inmueble={inmueble} />
            ))}
          </div>
        ))}
    </div>
  );
}
