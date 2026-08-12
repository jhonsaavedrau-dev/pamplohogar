import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { PerfilRoomie } from '../lib/tiposRoomie';
import { ETIQUETAS_CON_QUIEN, ETIQUETAS_RITMO } from '../lib/tiposRoomie';
import { pesos } from '../lib/formato';
import { Aviso } from './Estados';

interface Contacto {
  telefono: string;
  nombre: string;
  enlaceWhatsapp: string;
}

export function TarjetaRoomie({ perfil }: { perfil: PerfilRoomie }) {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [error, setError] = useState('');

  const pedirContacto = useMutation({
    mutationFn: () => pedir<Contacto>(`/api/roomies/${perfil.id}/contacto`, { metodo: 'POST' }),
    onSuccess: (d) => {
      setError('');
      setContacto(d);
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'No pudimos mostrar el contacto.'),
  });

  const esMio = usuario?.id === perfil.usuarioId;

  const senas: string[] = [ETIQUETAS_RITMO[perfil.ritmo]];
  if (perfil.conQuien !== 'CUALQUIERA') senas.push(ETIQUETAS_CON_QUIEN[perfil.conQuien]);
  if (perfil.fuma) senas.push('Fuma');
  else senas.push('No fuma');
  if (perfil.tieneMascota) senas.push('Tiene mascota');
  if (perfil.aceptaMascotas) senas.push('Acepta mascotas');

  return (
    <article data-revelar className="tarjeta flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-lg font-bold text-piedra-900">
            {perfil.nombre}
            {perfil.correoVerificado && (
              <span
                title="Confirmó su correo"
                className="grid h-5 w-5 place-items-center rounded-full bg-verificado-100 text-verificado-700"
              >
                <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                  <path d="M8.2 13.6 4.9 10.3l1.3-1.3 2 2 5.6-5.6 1.3 1.4z" />
                </svg>
                <span className="sr-only">Correo confirmado</span>
              </span>
            )}
          </p>
          {(perfil.carrera || perfil.semestre) && (
            <p className="mt-0.5 text-sm text-piedra-600">
              {perfil.carrera}
              {perfil.carrera && perfil.semestre ? ', ' : ''}
              {perfil.semestre ? `semestre ${perfil.semestre}` : ''}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg leading-none font-extrabold text-terracota-600">
            {pesos(perfil.presupuestoMax)}
          </p>
          <p className="mt-0.5 text-xs text-piedra-600">puede poner</p>
        </div>
      </div>

      {perfil.zonaPreferida && (
        <p className="mt-2 text-sm text-piedra-600">Le sirve por {perfil.zonaPreferida}</p>
      )}

      <p className="mt-3 flex-1 text-sm leading-relaxed whitespace-pre-line text-piedra-800">
        {perfil.descripcion}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {senas.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-piedra-100 pt-4">
        {esMio ? (
          <p className="text-center text-sm text-piedra-600">Este es tu perfil</p>
        ) : contacto ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-confianza-50 p-3 text-center">
              <p className="text-xs text-piedra-600">Celular de {contacto.nombre}</p>
              <p className="text-lg font-extrabold text-confianza-700">{contacto.telefono}</p>
            </div>
            <a
              href={contacto.enlaceWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="boton-primario w-full text-sm"
            >
              Escribirle por WhatsApp
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-2">
                <Aviso tipo="error">{error}</Aviso>
              </div>
            )}
            <button
              type="button"
              className="boton-primario w-full text-sm"
              disabled={pedirContacto.isPending}
              onClick={() => {
                if (!usuario) {
                  navegar('/entrar', { state: { desde: '/roomies' } });
                  return;
                }
                pedirContacto.mutate();
              }}
            >
              {pedirContacto.isPending ? 'Un momento...' : 'Escribirle'}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
