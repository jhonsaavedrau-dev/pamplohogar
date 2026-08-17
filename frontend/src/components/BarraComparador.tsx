import { Link, useLocation } from 'react-router-dom';
import { MAXIMO_COMPARABLES, useComparador } from '../lib/comparador';

/** Barra flotante que aparece apenas el estudiante marca algo para comparar. */
export function BarraComparador() {
  const { ids, limpiar } = useComparador();
  const ubicacion = useLocation();

  if (ids.length === 0) return null;
  if (ubicacion.pathname === '/comparar') return null;

  return (
    <>
      {/*
        Un hueco del mismo alto que la barra. Sin esto la barra flotante tapa
        el ultimo boton de la pagina y uno cree que no existe.
      */}
      <div aria-hidden="true" className="h-24" />
    {/*
      En el celular se apoya encima de la barra de abajo, no sobre ella: si las
      dos se pegan al fondo, esta tapa los botones de navegar. En el computador
      esa barra no existe y va al ras.
    */}
    <div className="sin-imprimir fixed inset-x-0 bottom-16 z-30 border-t border-piedra-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(36,31,26,0.10)] backdrop-blur md:bottom-0">
      <div className="contenedor-app flex items-center gap-3">
        <p className="flex-1 text-sm text-piedra-800">
          <strong>{ids.length}</strong> de {MAXIMO_COMPARABLES} para comparar
        </p>
        <button type="button" onClick={limpiar} className="boton-suave min-h-11 text-sm">
          Quitar todos
        </button>
        <Link
          to="/comparar"
          className={`boton-confianza min-h-11 text-sm ${ids.length < 2 ? 'pointer-events-none opacity-55' : ''}`}
          aria-disabled={ids.length < 2}
        >
          {ids.length < 2 ? 'Elige otro' : 'Comparar'}
        </Link>
      </div>
    </div>
    </>
  );
}
