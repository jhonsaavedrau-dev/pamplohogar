import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { alPerderSesion, borrarToken, guardarToken, leerToken, pedir } from './api';
import type { Rol, Usuario } from './tipos';

interface ValorSesion {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<Usuario>;
  registrar: (datos: DatosRegistro) => Promise<Usuario>;
  salir: () => void;
  refrescar: () => Promise<void>;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol: Rol;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    if (!leerToken()) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    try {
      const datos = await pedir<{ usuario: Usuario }>('/api/auth/yo');
      setUsuario(datos.usuario);
    } catch {
      borrarToken();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  // Si el servidor rechaza la sesion en cualquier peticion, la pantalla se entera
  // de una vez en lugar de seguir mostrando al usuario como si estuviera dentro.
  useEffect(() => alPerderSesion(() => setUsuario(null)), []);

  const entrar = useCallback(async (email: string, password: string) => {
    const datos = await pedir<RespuestaAuth>('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    });
    guardarToken(datos.token);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const registrar = useCallback(async (entrada: DatosRegistro) => {
    const datos = await pedir<RespuestaAuth>('/api/auth/registro', {
      metodo: 'POST',
      cuerpo: entrada,
    });
    guardarToken(datos.token);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const salir = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, registrar, salir, refrescar }),
    [usuario, cargando, entrar, registrar, salir, refrescar],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error('useSesion debe usarse dentro de ProveedorSesion.');
  return valor;
}
