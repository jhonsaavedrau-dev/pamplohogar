import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fechaCorta } from '../lib/formato';
import { SelectorEstrellas } from './Estrellas';
import { Aviso } from './Estados';
import type { RespuestaResenasBarrio } from '../lib/tipos';

/** Las tres cosas que un estudiante de fuera no tiene como averiguar solo. */
const ASPECTOS = [
  { clave: 'tranquilidad', titulo: 'Tranquilidad', pista: '¿Se puede dormir y estudiar?' },
  { clave: 'seguridad', titulo: 'Seguridad', pista: '¿Se puede caminar de noche?' },
  { clave: 'transporte', titulo: 'Transporte', pista: '¿Pasa buseta? ¿Se llega a pie?' },
] as const;

type ClaveAspecto = (typeof ASPECTOS)[number]['clave'];

function Barra({ valor }: { valor: number }) {
  // Alto es bueno en los tres, asi que el color puede significar lo mismo
  // siempre. Si uno fuera "ruido", el verde querria decir cosas contrarias.
  const color =
    valor >= 4 ? 'bg-verificado-600' : valor <= 2.5 ? 'bg-terracota-500' : 'bg-confianza-500';

  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-piedra-200">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${(valor / 5) * 100}%` }}
      />
    </div>
  );
}

export function ComoEsElBarrio({ barrio }: { barrio: string }) {
  const { usuario } = useSesion();
  const clientes = useQueryClient();
  const clave = ['resenasBarrio', barrio];

  const { data, isPending, isError } = useQuery({
    queryKey: clave,
    queryFn: () =>
      pedir<RespuestaResenasBarrio>(`/api/barrios/resenas/${encodeURIComponent(barrio)}`),
  });

  const [notas, setNotas] = useState<Record<ClaveAspecto, number>>({
    tranquilidad: 0,
    seguridad: 0,
    transporte: 0,
  });
  const [comentario, setComentario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [abierto, setAbierto] = useState(false);

  const enviar = useMutation({
    mutationFn: () =>
      pedir('/api/barrios/resenas', { metodo: 'POST', cuerpo: { barrio, ...notas, comentario } }),
    onSuccess: () => {
      setMensaje('Gracias. Tu opinión ya le sirve al siguiente estudiante.');
      setComentario('');
      setAbierto(false);
      void clientes.invalidateQueries({ queryKey: clave });
    },
    onError: (e) => {
      setMensaje(e instanceof Error ? e.message : 'No pudimos guardar tu opinión.');
    },
  });

  if (isPending) {
    return <div className="h-24 animate-pulse rounded-2xl bg-piedra-100" />;
  }

  // Que falle esto no debe tumbar la ficha del inmueble, que es lo importante.
  if (isError || !data) return null;

  const completo =
    notas.tranquilidad > 0 &&
    notas.seguridad > 0 &&
    notas.transporte > 0 &&
    comentario.trim().length >= 20;

  return (
    <section>
      <h2 className="titulo-seccion mb-1">Cómo es vivir en {barrio}</h2>
      <p className="mb-3 text-sm text-piedra-600">
        Lo cuentan estudiantes que ya vivieron ahí, no el arrendador.
      </p>

      {data.promedios ? (
        <div className="tarjeta space-y-3 p-4">
          {ASPECTOS.map((a) => (
            <div key={a.clave}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-piedra-900">{a.titulo}</span>
                <span className="text-sm tabular-nums text-piedra-700">
                  {data.promedios![a.clave].toFixed(1)} de 5
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Barra valor={data.promedios![a.clave]} />
              </div>
            </div>
          ))}
          <p className="pt-1 text-xs text-piedra-500">
            Promedio de {data.total} {data.total === 1 ? 'opinión' : 'opiniones'}.
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-piedra-100 px-4 py-5 text-sm text-piedra-700">
          {data.total === 0
            ? `Todavía nadie ha contado cómo es vivir en ${barrio}.`
            : `Solo ${data.total} ${data.total === 1 ? 'persona ha' : 'personas han'} opinado sobre ${barrio}. Con tan pocas no mostramos un promedio, porque una sola mala racha no define un barrio.`}
        </p>
      )}

      {data.resenas.length > 0 && (
        <ul className="mt-3 space-y-3">
          {data.resenas.map((r) => (
            <li key={r.id} className="tarjeta p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-piedra-900">{r.autor}</strong>
                {r.correoConfirmado && (
                  <span className="rounded-full bg-verificado-50 px-2 py-0.5 text-xs font-semibold text-verificado-700">
                    Correo confirmado
                  </span>
                )}
                {r.esMia && (
                  <span className="rounded-full bg-piedra-100 px-2 py-0.5 text-xs text-piedra-600">
                    Tu opinión
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-piedra-600">
                {ASPECTOS.map((a) => (
                  <span key={a.clave}>
                    {a.titulo} <strong className="text-piedra-900">{r[a.clave]}</strong>/5
                  </span>
                ))}
              </div>

              <p className="mt-2 text-sm text-piedra-800">{r.comentario}</p>
              <p className="mt-2 text-xs text-piedra-400">{fechaCorta(r.creadoEn)}</p>
            </li>
          ))}
        </ul>
      )}

      {usuario?.rol === 'ESTUDIANTE' && (
        <div className="mt-4">
          {mensaje && (
            <div className="mb-3">
              <Aviso tipo={enviar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>
            </div>
          )}

          {!abierto ? (
            <button type="button" className="boton-suave w-full" onClick={() => setAbierto(true)}>
              {data.yaOpine ? `Cambiar mi opinión sobre ${barrio}` : `Contar cómo es ${barrio}`}
            </button>
          ) : (
            <div className="tarjeta space-y-4 p-4">
              <h3 className="font-bold text-piedra-900">Cómo es vivir en {barrio}</h3>

              {ASPECTOS.map((a) => (
                <div key={a.clave}>
                  <p className="text-sm font-semibold text-piedra-900">{a.titulo}</p>
                  <p className="mb-1 text-xs text-piedra-600">{a.pista}</p>
                  <SelectorEstrellas
                    valor={notas[a.clave]}
                    alCambiar={(v) => setNotas((n) => ({ ...n, [a.clave]: v }))}
                  />
                </div>
              ))}

              <textarea
                className="campo min-h-24 py-3"
                rows={3}
                placeholder="¿Qué debería saber alguien que va a vivir ahí? Ruido, calles, buses, comercio cerca."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />

              <button
                type="button"
                className="boton-confianza w-full"
                disabled={enviar.isPending || !completo}
                onClick={() => enviar.mutate()}
              >
                {enviar.isPending ? 'Enviando...' : 'Publicar mi opinión'}
              </button>

              {!completo && (
                <p className="text-xs text-piedra-500">
                  Califica los tres puntos y escribe al menos 20 caracteres.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
