import { useEffect, useState } from 'react';

/**
 * Le avisa a la persona que se quedo sin senal, para que entienda por que ve
 * lo mismo de antes y no intente publicar ni contactar creyendo que si va.
 */
export function AvisoSinConexion() {
  const [sinConexion, setSinConexion] = useState(!navigator.onLine);

  useEffect(() => {
    const conectado = () => setSinConexion(false);
    const desconectado = () => setSinConexion(true);
    window.addEventListener('online', conectado);
    window.addEventListener('offline', desconectado);
    return () => {
      window.removeEventListener('online', conectado);
      window.removeEventListener('offline', desconectado);
    };
  }, []);

  if (!sinConexion) return null;

  return (
    <div className="sin-imprimir bg-piedra-800 px-4 py-2 text-center text-sm font-semibold text-white">
      Sin conexión. Estás viendo lo que ya habías abierto.
    </div>
  );
}
