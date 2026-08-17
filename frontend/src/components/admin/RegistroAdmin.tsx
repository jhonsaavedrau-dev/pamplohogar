import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { Cargando, EstadoVacio, EstadoError } from '../Estados';

type AccionAdmin =
  | 'OCULTO_INMUEBLE'
  | 'MOSTRO_INMUEBLE'
  | 'ELIMINO_INMUEBLE'
  | 'ELIMINO_USUARIO'
  | 'CAMBIO_ROL'
  | 'ELIMINO_RESENA'
  | 'ATENDIO_REPORTE'
  | 'DESCARTO_REPORTE';

interface Registro {
  id: string;
  accion: AccionAdmin;
  descripcion: string;
  creadoEn: string;
  admin: string;
  adminEmail: string;
}

const ETIQUETAS: Record<AccionAdmin, string> = {
  OCULTO_INMUEBLE: 'Retiró un inmueble',
  MOSTRO_INMUEBLE: 'Volvió a publicar un inmueble',
  ELIMINO_INMUEBLE: 'Eliminó un inmueble',
  ELIMINO_USUARIO: 'Eliminó una cuenta',
  CAMBIO_ROL: 'Cambió un rol',
  ELIMINO_RESENA: 'Retiro una reseña',
  ATENDIO_REPORTE: 'Atendió un reporte',
  DESCARTO_REPORTE: 'Descartó un reporte',
};

/** Las acciones que borran algo se marcan distinto: son las irreversibles. */
const ES_DESTRUCTIVA: Record<AccionAdmin, boolean> = {
  OCULTO_INMUEBLE: false,
  MOSTRO_INMUEBLE: false,
  ELIMINO_INMUEBLE: true,
  ELIMINO_USUARIO: true,
  CAMBIO_ROL: false,
  ELIMINO_RESENA: true,
  ATENDIO_REPORTE: false,
  DESCARTO_REPORTE: false,
};

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

export function RegistroAdmin() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'registro'],
    queryFn: () => pedir<{ registros: Registro[] }>('/api/admin/registro'),
  });

  if (isLoading) return <Cargando texto="Cargando el registro..." />;
  if (isError || !data) {
    return (
      <EstadoError
        mensaje={error instanceof Error ? error.message : 'No pudimos cargar el registro.'}
        alReintentar={() => void refetch()}
      />
    );
  }

  if (data.registros.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay nada anotado"
        descripcion="Cuando un administrador retire una publicación, elimine una cuenta o atienda un reporte, queda aquí con su nombre y la fecha."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-piedra-600">
        Las {data.registros.length} acciones mas recientes. Sirve para saber quien hizo que, sobre
        todo cuando haya mas de un administrador.
      </p>

      <ol className="space-y-2">
        {data.registros.map((r) => (
          <li
            key={r.id}
            className={`tarjeta p-4 ${ES_DESTRUCTIVA[r.accion] ? 'border-terracota-200' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  ES_DESTRUCTIVA[r.accion]
                    ? 'bg-terracota-100 text-terracota-700'
                    : 'bg-piedra-100 text-piedra-600'
                }`}
              >
                {ETIQUETAS[r.accion]}
              </span>
              <span className="text-xs text-piedra-400">{formatoFechaHora.format(new Date(r.creadoEn))}</span>
            </div>

            <p className="mt-2 text-sm text-piedra-800">{r.descripcion}</p>
            <p className="mt-1 text-xs text-piedra-600">
              {r.admin} <span className="text-piedra-400">({r.adminEmail})</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
