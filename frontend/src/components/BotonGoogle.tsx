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

  // Google no deja pedir la altura, pero el ancho si. Se mide el hueco donde
  // va, para que quede tan ancho como el boton de al lado y no flotando mas
  // angosto en el medio. Se vuelve a medir si cambia el tamano de la ventana.
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const medir = () => setAncho(caja.current?.offsetWidth ?? 0);
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [clienteId]);

  useEffect(() => {
    if (clienteId === '' || caja.current === null || ancho === 0) return;

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
          // Google lo limita a 400, que es mas de lo que mide el formulario.
          width: Math.min(400, ancho),
        });
      })
      .catch(() => {
        if (!cancelado) setFalloLaCarga(true);
      });

    return () => {
      cancelado = true;
    };
  }, [clienteId, ancho, alRecibirCredencial]);

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
      {/*
        Google dibuja su propio boton aqui dentro y no deja pedirle la altura:
        sale de 40 y los nuestros son de 48. En vez de estirarlo a la fuerza,
        que se veria borroso, se centra en un hueco de 48 para que las filas
        queden parejas.
      */}
      <div className="grid min-h-12 place-items-center">
        <div ref={caja} className="w-full" />
      </div>
    </div>
  );
}
