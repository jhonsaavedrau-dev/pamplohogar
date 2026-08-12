import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';

const CLAVE_OCULTO = 'pamplohogar.avisoCorreoOculto';

/** Recordatorio discreto para confirmar el correo. Se puede cerrar. */
export function AvisoCorreoSinConfirmar() {
  const { usuario } = useSesion();
  const [oculto, setOculto] = useState(
    () => window.sessionStorage.getItem(CLAVE_OCULTO) === 'si',
  );
  const [mensaje, setMensaje] = useState('');

  const reenviar = useMutation({
    mutationFn: () =>
      pedir<{ mensaje: string }>('/api/auth/verificar/enviar', { metodo: 'POST' }),
    onSuccess: (r) => setMensaje(r.mensaje),
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos enviarlo.'),
  });

  if (!usuario || usuario.emailVerificado || oculto) return null;

  const cerrar = () => {
    window.sessionStorage.setItem(CLAVE_OCULTO, 'si');
    setOculto(true);
  };

  return (
    <div className="sin-imprimir border-b border-terracota-200 bg-terracota-50">
      <div className="contenedor-app flex flex-wrap items-center gap-3 py-3">
        <p className="flex-1 text-sm text-piedra-800">
          {mensaje !== '' ? (
            mensaje
          ) : (
            <>
              Confirma tu correo <strong>{usuario.email}</strong> para darle mas confianza a quien
              te escriba.
            </>
          )}
        </p>

        {mensaje === '' && (
          <button
            type="button"
            onClick={() => reenviar.mutate()}
            disabled={reenviar.isPending}
            className="min-h-10 rounded-xl bg-terracota-500 px-4 text-sm font-semibold text-white disabled:opacity-55"
          >
            {reenviar.isPending ? 'Enviando...' : 'Enviarme el correo'}
          </button>
        )}

        <button
          type="button"
          onClick={cerrar}
          aria-label="Ocultar este aviso"
          className="grid h-10 w-10 place-items-center rounded-xl text-lg text-piedra-600 hover:bg-terracota-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
