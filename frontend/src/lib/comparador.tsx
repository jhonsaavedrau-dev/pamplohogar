import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const CLAVE = 'pamplohogar.comparador';
export const MAXIMO_COMPARABLES = 3;

interface ValorComparador {
  ids: string[];
  alternar: (id: string) => void;
  quitar: (id: string) => void;
  limpiar: () => void;
  estaLleno: boolean;
  contiene: (id: string) => boolean;
}

const Contexto = createContext<ValorComparador | null>(null);

function leerGuardados(): string[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos.filter((x): x is string => typeof x === 'string').slice(0, MAXIMO_COMPARABLES);
  } catch {
    return [];
  }
}

/**
 * La seleccion vive en el navegador y no en el servidor: es una ayuda momentanea
 * para decidir, no algo que valga la pena guardar en la cuenta.
 */
export function ProveedorComparador({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(leerGuardados);

  useEffect(() => {
    window.localStorage.setItem(CLAVE, JSON.stringify(ids));
  }, [ids]);

  const alternar = useCallback((id: string) => {
    setIds((previos) => {
      if (previos.includes(id)) return previos.filter((x) => x !== id);
      if (previos.length >= MAXIMO_COMPARABLES) return previos;
      return [...previos, id];
    });
  }, []);

  const quitar = useCallback((id: string) => {
    setIds((previos) => previos.filter((x) => x !== id));
  }, []);

  const limpiar = useCallback(() => setIds([]), []);

  const valor = useMemo(
    () => ({
      ids,
      alternar,
      quitar,
      limpiar,
      estaLleno: ids.length >= MAXIMO_COMPARABLES,
      contiene: (id: string) => ids.includes(id),
    }),
    [ids, alternar, quitar, limpiar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useComparador(): ValorComparador {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useComparador debe usarse dentro de ProveedorComparador.');
  return valor;
}
