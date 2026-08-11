import { useState } from 'react';

interface Props {
  url: string;
  alt: string;
  className?: string;
  cargaDiferida?: boolean;
}

/**
 * Imagen que no deja un hueco gris si la foto ya no existe:
 * al fallar muestra un aviso legible en lugar del icono roto del navegador.
 */
export function FotoInmueble({ url, alt, className = '', cargaDiferida = true }: Props) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div
        className={`flex items-center justify-center bg-piedra-100 text-center text-xs text-piedra-400 ${className}`}
      >
        Foto no disponible
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={cargaDiferida ? 'lazy' : 'eager'}
      onError={() => setFallo(true)}
      className={className}
    />
  );
}
