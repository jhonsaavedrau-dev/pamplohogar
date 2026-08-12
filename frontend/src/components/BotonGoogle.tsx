import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../lib/api';

/*
  El boton de "Entrar con Google".

  La libreria de Google se carga desde su servidor solo si el boton esta
  encendido. Si Jhon no ha configurado el identificador de cliente, aqui no se
  descarga nada y el boton no aparece: no tiene sentido cargar un archivo
  ajeno en cada visita para una funcion apagada.
*/

interface Google {
  accounts: {
    id: {
      initialize: (opciones: {
        client_id: string;
        callback: (r: { credential: string }) => void;
      }) => void;
      renderButton: (donde: HTMLElement, opciones: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: Google;
  }
}

const DIRECCION = 'https://accounts.google.com/gsi/client';

/** Carga la libreria una sola vez, aunque haya dos botones en la pagina. */
let cargando: Promise<void> | null = null;

function cargarLibreria(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (cargando !== null) return cargando;

  cargando = new Promise((listo, falla) => {
    const etiqueta = document.createElement('script');
    etiqueta.src = DIRECCION;
    etiqueta.async = true;
    etiqueta.defer = true;
    etiqueta.onload = () => listo();
    etiqueta.onerror = () => falla(new Error('No se pudo cargar Google'));
    document.head.appendChild(etiqueta);
  });

  return cargando;
}

export function BotonGoogle({
  alRecibirCredencial,
}: {
  alRecibirCredencial: (credencial: string) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [falloLaCarga, setFalloLaCarga] = useState(false);

  const { data } = useQuery({
    queryKey: ['googleEstado'],
    queryFn: () => pedir<{ disponible: boolean; clienteId: string }>('/api/auth/google/estado'),
    staleTime: 10 * 60 * 1000,
  });

  const clienteId = data?.disponible === true ? data.clienteId : '';

  useEffect(() => {
    if (clienteId === '' || caja.current === null) return;

    let cancelado = false;
    cargarLibreria()
      .then(() => {
        if (cancelado || !window.google || caja.current === null) return;
        window.google.accounts.id.initialize({
          client_id: clienteId,
          callback: (r) => alRecibirCredencial(r.credential),
        });
        window.google.accounts.id.renderButton(caja.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'es-419',
          width: 320,
        });
      })
      .catch(() => {
        if (!cancelado) setFalloLaCarga(true);
      });

    return () => {
      cancelado = true;
    };
  }, [clienteId, alRecibirCredencial]);

  if (clienteId === '') return null;

  if (falloLaCarga) {
    return (
      <p className="text-center text-sm text-piedra-600">
        No pudimos cargar el botón de Google. Entra con tu correo y contraseña.
      </p>
    );
  }

  return (
    <div>
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-piedra-200" />
        <span className="text-xs font-semibold tracking-wide text-piedra-500 uppercase">o</span>
        <span className="h-px flex-1 bg-piedra-200" />
      </div>
      {/* Google dibuja su propio boton aqui dentro. */}
      <div ref={caja} className="flex justify-center" />
    </div>
  );
}
