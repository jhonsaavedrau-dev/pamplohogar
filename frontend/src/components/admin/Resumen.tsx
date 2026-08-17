import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import type { ResumenAdmin } from '../../lib/tipos';
import { pesos } from '../../lib/formato';
import { Cargando, EstadoError } from '../Estados';

interface PropsDato {
  etiqueta: string;
  valor: string;
  pie?: string;
  alerta?: boolean;
}

function Dato({ etiqueta, valor, pie, alerta = false }: PropsDato) {
  return (
    <div className={`tarjeta p-4 ${alerta ? 'border-terracota-200 bg-terracota-50' : ''}`}>
      <p className="text-sm text-piedra-600">{etiqueta}</p>
      <p
        className={`mt-1 text-2xl font-extrabold ${alerta ? 'text-terracota-700' : 'text-piedra-900'}`}
      >
        {valor}
      </p>
      {pie && <p className="mt-1 text-xs text-piedra-600">{pie}</p>}
    </div>
  );
}

export function Resumen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'resumen'],
    queryFn: () => pedir<ResumenAdmin>('/api/admin/resumen'),
  });

  if (isLoading) return <Cargando texto="Contando..." />;
  if (isError || !data) {
    return (
      <EstadoError
        mensaje={error instanceof Error ? error.message : 'No pudimos cargar el resumen.'}
        alReintentar={() => void refetch()}
      />
    );
  }

  const totalUsuarios =
    data.usuarios.estudiantes + data.usuarios.arrendadores + data.usuarios.administradores;

  return (
    <div className="space-y-6">
      {data.actividad.reportesPendientes > 0 && (
        <div className="rounded-2xl border border-terracota-200 bg-terracota-50 p-4">
          <p className="font-bold text-terracota-700">
            Tienes {data.actividad.reportesPendientes}{' '}
            {data.actividad.reportesPendientes === 1
              ? 'reporte sin revisar'
              : 'reportes sin revisar'}
          </p>
          <p className="mt-1 text-sm text-piedra-600">
            Son avisos de estudiantes sobre publicaciones que no deberian estar. Revisalos en la
            pestana Reportes.
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-piedra-900">Quién está en la plataforma</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Dato etiqueta="Personas registradas" valor={String(totalUsuarios)} />
          <Dato etiqueta="Estudiantes" valor={String(data.usuarios.estudiantes)} />
          <Dato etiqueta="Arrendadores" valor={String(data.usuarios.arrendadores)} />
          <Dato etiqueta="Administradores" valor={String(data.usuarios.administradores)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-piedra-900">Inmuebles</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Dato etiqueta="Publicados" valor={String(data.inmuebles.activos)} />
          <Dato etiqueta="Ocultos" valor={String(data.inmuebles.ocultos)} />
          <Dato
            etiqueta="Sin fotos"
            valor={String(data.inmuebles.sinFotos)}
            pie={data.inmuebles.sinFotos > 0 ? 'Se ven mal en el listado' : 'Todos tienen foto'}
            alerta={data.inmuebles.sinFotos > 0}
          />
          <Dato
            etiqueta="Precios raros"
            valor={String(data.precios.inusuales)}
            pie={
              data.precios.inusuales > 0
                ? 'Muy lejos del precio normal'
                : 'Ningún precio se sale de lo normal'
            }
            alerta={data.precios.inusuales > 0}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-piedra-900">Movimiento</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Dato
            etiqueta="Contactos solicitados"
            valor={String(data.actividad.solicitudes)}
            pie="Veces que un estudiante pidió el celular"
          />
          <Dato etiqueta="Reseñas escritas" valor={String(data.actividad.resenas)} />
          <Dato
            etiqueta="Precio tipico"
            valor={pesos(data.precios.mediana)}
            pie="La mitad cuesta menos que esto"
          />
          <Dato
            etiqueta="Rango"
            valor={`${pesos(data.precios.minimo)}`}
            pie={`hasta ${pesos(data.precios.maximo)}`}
          />
        </div>
      </section>
    </div>
  );
}
