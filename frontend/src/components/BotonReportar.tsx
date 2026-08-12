import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { EstadoReporte, MotivoReporte } from '../lib/tipos';
import { MOTIVOS_REPORTE } from '../lib/tipos';
import { Aviso } from './Estados';

interface ReporteMio {
  motivo: MotivoReporte;
  estado: EstadoReporte;
  creadoEn: string;
}

export function BotonReportar({ inmuebleId }: { inmuebleId: string }) {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoReporte | ''>('');
  const [detalle, setDetalle] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { data } = useQuery({
    queryKey: ['reporte-mio', inmuebleId],
    queryFn: () => pedir<{ reporte: ReporteMio | null }>(`/api/inmuebles/${inmuebleId}/reportes/mio`),
    enabled: usuario !== null,
  });

  const enviar = useMutation({
    mutationFn: () =>
      pedir<{ mensaje: string }>(`/api/inmuebles/${inmuebleId}/reportes`, {
        metodo: 'POST',
        cuerpo: { motivo, detalle },
      }),
    onSuccess: (r) => {
      setMensaje(r.mensaje);
      setDetalle('');
      setMotivo('');
      void clienteQuery.invalidateQueries({ queryKey: ['reporte-mio', inmuebleId] });
      window.setTimeout(() => setAbierto(false), 2500);
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos enviar el reporte.'),
  });

  const yaReportado = data?.reporte != null;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!usuario) {
            navegar('/entrar', { state: { desde: `/inmueble/${inmuebleId}` } });
            return;
          }
          setMensaje('');
          setAbierto(true);
        }}
        className="tocable text-sm font-semibold text-piedra-600 underline underline-offset-2 hover:text-terracota-600"
      >
        {yaReportado ? 'Ya reportaste esta publicación' : 'Reportar esta publicación'}
      </button>
    );
  }

  return (
    <div className="tarjeta space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-piedra-900">Reportar esta publicación</h3>
          <p className="mt-1 text-sm text-piedra-600">
            Solo lo ve el equipo de PamploHogar. El arrendador no sabe quien lo reporto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-piedra-600 hover:bg-piedra-100"
        >
          ×
        </button>
      </div>

      {mensaje && <Aviso tipo={enviar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>}

      {yaReportado && !enviar.isSuccess && (
        <Aviso tipo="exito">
          Ya nos avisaste sobre esta publicación. Si envias otro, reemplaza al anterior.
        </Aviso>
      )}

      <fieldset>
        <legend className="etiqueta">Que paso?</legend>
        <div className="space-y-2">
          {MOTIVOS_REPORTE.map((m) => (
            <button
              key={m.valor}
              type="button"
              onClick={() => setMotivo(m.valor)}
              aria-pressed={motivo === m.valor}
              className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                motivo === m.valor
                  ? 'border-terracota-500 bg-terracota-50'
                  : 'border-piedra-200 bg-white'
              }`}
            >
              <span className="block text-sm font-bold text-piedra-900">{m.etiqueta}</span>
              <span className="block text-xs text-piedra-600">{m.ayuda}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="etiqueta" htmlFor="detalle-reporte">
          Cuentanos con tus palabras
        </label>
        <textarea
          id="detalle-reporte"
          className="campo min-h-24 py-3"
          rows={3}
          maxLength={1000}
          placeholder="Entre mas concreto seas, mas rápido podemos actuar."
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
        <p className="mt-1 text-xs text-piedra-600">{detalle.trim().length} de 20 minimo</p>
      </div>

      <button
        type="button"
        className="boton-primario w-full"
        disabled={enviar.isPending || motivo === '' || detalle.trim().length < 20}
        onClick={() => enviar.mutate()}
      >
        {enviar.isPending ? 'Enviando...' : 'Enviar reporte'}
      </button>
    </div>
  );
}
