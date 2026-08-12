import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { IconoMarca } from './Marca';

interface Props {
  children: ReactNode;
}

interface Estado {
  fallo: boolean;
}

/**
 * Si algo revienta en la interfaz, el usuario ve un mensaje claro en espanol
 * en lugar de una pantalla en blanco.
 */
export class LimiteDeError extends Component<Props, Estado> {
  override state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      // Solo en desarrollo, para poder diagnosticar sin ensuciar produccion.
      // eslint-disable-next-line no-console
      console.error('Fallo en la interfaz de PamploHogar', error, info);
    }
  }

  override render(): ReactNode {
    if (!this.state.fallo) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <IconoMarca className="h-16 w-16" />
        <h1 className="titular">Se nos cayo la página</h1>
        <p className="max-w-sm text-piedra-600">
          Algo falló de nuestro lado. Recarga la página y si vuelve a pasar, escribenos para
          arreglarlo.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="boton-primario mt-2"
        >
          Volver al inicio
        </button>
      </div>
    );
  }
}
