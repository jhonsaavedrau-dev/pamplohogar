import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { pedir } from '../lib/api';
import { pesos } from '../lib/formato';
import { Aviso, Cargando, EstadoError } from '../components/Estados';
import { SEGUNDOS_ENTRE_REVISIONES } from './Mensajes';
import type { RespuestaConversacion } from '../lib/tipos';

const hora = (fecha: string): string =>
  new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const dia = (fecha: string): string =>
  new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

export function Conversacion() {
  const { id = '' } = useParams();
  const clientes = useQueryClient();
  const [texto, setTexto] = useState('');
  const finalRef = useRef<HTMLDivElement>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['conversacion', id],
    queryFn: () => pedir<RespuestaConversacion>(`/api/conversaciones/${id}`),
    refetchInterval: SEGUNDOS_ENTRE_REVISIONES * 1000,
  });

  const cuantos = data?.mensajes.length ?? 0;

  // Al abrir y al llegar algo nuevo, la vista baja hasta lo ultimo, que es lo
  // que uno quiere leer.
  useEffect(() => {
    finalRef.current?.scrollIntoView({ block: 'end' });
  }, [cuantos]);

  const enviar = useMutation({
    mutationFn: (mensaje: string) =>
      pedir(`/api/conversaciones/${id}/mensajes`, { metodo: 'POST', cuerpo: { texto: mensaje } }),
    onSuccess: () => {
      setTexto('');
      void clientes.invalidateQueries({ queryKey: ['conversacion', id] });
      void clientes.invalidateQueries({ queryKey: ['conversaciones'] });
      void clientes.invalidateQueries({ queryKey: ['mensajesSinLeer'] });
    },
  });

  if (isPending) return <Cargando texto="Abriendo la conversación..." />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos abrir la conversación.'}
          alReintentar={() => void refetch()}
        />
      </div>
    );
  }

  const { conversacion, mensajes } = data;
  let diaAnterior = '';

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col px-4 py-4">
      <div className="tarjeta mb-3 flex items-center gap-3 p-3">
        <Link to="/mensajes" className="text-sm font-semibold text-confianza-600">
          Volver
        </Link>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-piedra-900">{conversacion.con}</strong>
          <Link
            to={`/inmueble/${conversacion.inmueble.id}`}
            className="block truncate text-sm text-piedra-600 underline decoration-piedra-300"
          >
            {conversacion.inmueble.titulo} - {pesos(conversacion.inmueble.precio)}
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
        {mensajes.length === 0 && (
          <p className="rounded-xl bg-piedra-100 px-4 py-6 text-center text-sm text-piedra-600">
            {conversacion.soyElArrendador
              ? 'Todavía nadie ha escrito en esta conversación.'
              : 'Escribe lo que quieras preguntar. Un buen comienzo es cuándo puedes ir a verlo y qué incluye el arriendo.'}
          </p>
        )}

        {mensajes.map((m) => {
          const suDia = dia(m.creadoEn);
          const cambioDeDia = suDia !== diaAnterior;
          diaAnterior = suDia;

          return (
            <div key={m.id}>
              {cambioDeDia && (
                <p className="py-2 text-center text-xs text-piedra-500">{suDia}</p>
              )}
              <div className={`flex ${m.mio ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    m.mio
                      ? 'bg-confianza-500 text-white'
                      : 'border border-piedra-200 bg-white text-piedra-900'
                  }`}
                >
                  <p className="text-[0.95rem] whitespace-pre-wrap break-words">{m.texto}</p>
                  <p
                    className={`mt-1 text-right text-[0.7rem] ${
                      m.mio ? 'text-confianza-100' : 'text-piedra-400'
                    }`}
                  >
                    {hora(m.creadoEn)}
                    {m.mio && (m.leido ? ' - Leído' : ' - Enviado')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={finalRef} />
      </div>

      {enviar.isError && (
        <div className="mb-2">
          <Aviso tipo="error">
            {enviar.error instanceof Error ? enviar.error.message : 'No pudimos enviar el mensaje.'}
          </Aviso>
        </div>
      )}

      <form
        className="flex items-end gap-2 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          const limpio = texto.trim();
          if (limpio.length > 0 && !enviar.isPending) enviar.mutate(limpio);
        }}
      >
        <textarea
          className="campo max-h-32 min-h-12 flex-1 resize-none py-3"
          rows={1}
          placeholder="Escribe tu mensaje"
          value={texto}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift con Enter hace salto de linea. En celular el
            // teclado manda salto de linea y no dispara esto, asi que ahi se
            // usa el boton.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const limpio = texto.trim();
              if (limpio.length > 0 && !enviar.isPending) enviar.mutate(limpio);
            }
          }}
        />
        <button
          type="submit"
          className="boton-confianza shrink-0"
          disabled={enviar.isPending || texto.trim().length === 0}
        >
          {enviar.isPending ? 'Enviando' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
