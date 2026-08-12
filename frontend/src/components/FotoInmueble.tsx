import { useState } from 'react';
import { fotoDeAncho, juegoDeAnchos } from '../lib/fotos';

interface Props {
  url: string;
  alt: string;
  className?: string;
  cargaDiferida?: boolean;
  /**
   * Cuanto espacio ocupa la foto en pantalla. Sin esto el navegador supone el
   * ancho completo y se baja la version grande aunque quepa una pequena.
   */
  medidas?: string;
  /** Ancho al que se pide la foto cuando el navegador no soporta el juego de tamanos. */
  anchoBase?: number;
}

export function FotoInmueble({
  url,
  alt,
  className = '',
  cargaDiferida = true,
  medidas = '(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw',
  anchoBase = 800,
}: Props) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div
        className={`flex items-center justify-center bg-piedra-100 text-center text-xs text-piedra-500 ${className}`}
      >
        Foto no disponible
      </div>
    );
  }

  return (
    <img
      src={fotoDeAncho(url, anchoBase)}
      srcSet={juegoDeAnchos(url)}
      sizes={medidas}
      alt={alt}
      loading={cargaDiferida ? 'lazy' : 'eager'}
      decoding="async"
      onError={() => setFallo(true)}
      className={className}
    />
  );
}
