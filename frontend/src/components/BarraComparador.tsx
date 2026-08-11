import { Link, useLocation } from 'react-router-dom';
import { MAXIMO_COMPARABLES, useComparador } from '../lib/comparador';

/** Barra flotante que aparece apenas el estudiante marca algo para comparar. */
export function BarraComparador() {
  const { ids, limpiar } = useComparador();
  const ubicacion = useLocation();

  if (ids.length === 0) return null;
  if (ubicacion.pathname === '/comparar') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-piedra-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(36,31,26,0.10)] backdrop-blur">
      <div className="contenedor-app flex items-center gap-3">
        <p className="flex-1 text-sm text-piedra-800">
          <strong>{ids.length}</strong> de {MAXIMO_COMPARABLES} para comparar
        </p>
        <button type="button" onClick={limpiar} className="boton-suave text-sm">
          Quitar todos
        </button>
        <Link
          to="/comparar"
          className={`boton-confianza text-sm ${ids.length < 2 ? 'pointer-events-none opacity-55' : ''}`}
          aria-disabled={ids.length < 2}
        >
          {ids.length < 2 ? 'Elige otro' : 'Comparar'}
        </Link>
      </div>
    </div>
  );
}
