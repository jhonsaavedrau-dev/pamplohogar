import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import type { EstadoReporte, ReporteAdmin } from '../../lib/tipos';
import { ETIQUETAS_MOTIVO } from '../../lib/tipos';
import { fechaCorta, pesos } from '../../lib/formato';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../Estados';

interface Respuesta {
  pendientes: number;
  reportes: ReporteAdmin[];
}

const FILTROS = [
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'ATENDIDO', etiqueta: 'Atendidos' },
  { valor: 'DESCARTADO', etiqueta: 'Descartados' },
  { valor: 'todos', etiqueta: 'Todos' },
] as const;

const ETIQUETA_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: 'Pendiente',
  ATENDIDO: 'Atendido',
  DESCARTADO: 'Descartado',
};

export function ReportesAdmin() {
  const [estado, setEstado] = useState<(typeof FILTROS)[number]['valor']>('PENDIENTE');
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'reportes', estado],
    queryFn: () => pedir<Respuesta>(`/api/admin/reportes?estado=${estado}`),
  });

  const atender = useMutation({
    mutationFn: ({ id, nuevoEstado }: { id: string; nuevoEstado: 'ATENDIDO' | 'DESCARTADO' }) =>
      pedir(`/api/admin/reportes/${id}`, {
        metodo: 'PATCH',
        cuerpo: { estado: nuevoEstado, notaAdmin: notas[id]?.trim() || undefined },
      }),
    onSuccess: (_r, v) => {
      setMensaje(
        v.nuevoEstado === 'ATENDIDO'
          ? 'Reporte marcado como atendido.'
          : 'Reporte descartado. Queda guardado por si acaso.',
      );
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos actualizarlo.'),
  });

  const ocultarInmueble = useMutation({
    mutationFn: (id: string) =>
      pedir(`/api/inmuebles/${id}`, { metodo: 'PATCH', cuerpo: { activo: false } }),
    onSuccess: () => {
      setMensaje('Inmueble retirado del listado.');
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
      void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos retirarlo.'),
  });

  return (
    <div className="space-y-4">
      {mensaje && (
        <Aviso tipo={atender.isError || ocultarInmueble.isError ? 'error' : 'exito'}>
          {mensaje}
        </Aviso>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setEstado(f.valor)}
            aria-pressed={estado === f.valor}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              estado === f.valor
                ? 'border-confianza-500 bg-confianza-500 text-white'
                : 'border-piedra-200 bg-white text-piedra-800'
            }`}
          >
            {f.etiqueta}
            {f.valor === 'PENDIENTE' && data && data.pendientes > 0 && (
              <span className="ml-2 rounded-full bg-terracota-500 px-2 py-0.5 text-xs text-white">
                {data.pendientes}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <Cargando texto="Cargando reportes..." />}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar los reportes.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data &&
        (data.reportes.length === 0 ? (
          <EstadoVacio
            titulo={estado === 'PENDIENTE' ? 'No hay nada pendiente' : 'Nada por aqui'}
            descripcion={
              estado === 'PENDIENTE'
                ? 'Cuando un estudiante reporte una publicacion, aparece aqui para que la revises.'
                : 'Cambia el filtro para ver reportes en otro estado.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.reportes.map((r) => (
              <li key={r.id} className="tarjeta space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-terracota-100 px-3 py-1 text-xs font-bold text-terracota-700">
                    {ETIQUETAS_MOTIVO[r.motivo]}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      r.estado === 'PENDIENTE'
                        ? 'bg-confianza-100 text-confianza-700'
                        : 'bg-piedra-100 text-piedra-600'
                    }`}
                  >
                    {ETIQUETA_ESTADO[r.estado]}
                  </span>
                  {!r.inmueble.activo && (
                    <span className="rounded-full bg-piedra-800 px-3 py-1 text-xs font-bold text-white">
                      Ya esta oculto
                    </span>
                  )}
                  <span className="text-xs text-piedra-400">{fechaCorta(r.creadoEn)}</span>
                </div>

                <p className="text-sm whitespace-pre-line text-piedra-800">{r.detalle}</p>

                <div className="rounded-xl bg-piedra-100 p-3 text-sm">
                  <Link
                    to={`/inmueble/${r.inmueble.id}`}
                    className="font-bold text-piedra-900 hover:text-terracota-600"
                  >
                    {r.inmueble.titulo}
                  </Link>
                  <p className="mt-1 text-piedra-600">
                    {pesos(r.inmueble.precio)} · publicado por {r.inmueble.arrendador.nombre}{' '}
                    <span className="text-piedra-400">({r.inmueble.arrendador.email})</span>
                  </p>
                  <p className="mt-1 text-xs text-piedra-600">
                    Reportado por {r.autor.nombre}{' '}
                    <span className="text-piedra-400">({r.autor.email})</span>
                  </p>
                </div>

                {r.estado === 'PENDIENTE' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="campo"
                      maxLength={500}
                      placeholder="Nota interna: que hiciste con este reporte (opcional)"
                      value={notas[r.id] ?? ''}
                      onChange={(e) => setNotas((p) => ({ ...p, [r.id]: e.target.value }))}
                      aria-label="Nota interna sobre el reporte"
                    />
                    <div className="flex flex-wrap gap-2">
                      {r.inmueble.activo && (
                        <button
                          type="button"
                          className="boton-primario flex-1 text-sm"
                          disabled={ocultarInmueble.isPending}
                          onClick={() => ocultarInmueble.mutate(r.inmueble.id)}
                        >
                          Retirar publicacion
                        </button>
                      )}
                      <button
                        type="button"
                        className="boton-confianza flex-1 text-sm"
                        disabled={atender.isPending}
                        onClick={() => atender.mutate({ id: r.id, nuevoEstado: 'ATENDIDO' })}
                      >
                        Marcar atendido
                      </button>
                      <button
                        type="button"
                        className="boton-suave flex-1 text-sm"
                        disabled={atender.isPending}
                        onClick={() => atender.mutate({ id: r.id, nuevoEstado: 'DESCARTADO' })}
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-piedra-600">
                    {ETIQUETA_ESTADO[r.estado]} por {r.atendidoPor ?? 'alguien'}
                    {r.atendidoEn ? ` el ${fechaCorta(r.atendidoEn)}` : ''}
                    {r.notaAdmin ? ` · ${r.notaAdmin}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
