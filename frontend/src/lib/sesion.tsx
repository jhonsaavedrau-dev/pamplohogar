import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { alPerderSesion, borrarToken, guardarToken, leerToken, pedir } from './api';
import type { Rol, Usuario } from './tipos';

interface ValorSesion {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<ResultadoEntrar>;
  terminarConCodigo: (paseIntermedio: string, codigo: string) => Promise<Usuario>;
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

/**
 * Cuando la cuenta tiene verificacion en dos pasos, la contrasena correcta no
 * abre nada todavia: devuelve un pase que solo sirve para el segundo tramo.
 */
interface RespuestaConCodigo {
  requiereCodigo: true;
  paseIntermedio: string;
}

export type ResultadoEntrar =
  | { listo: true; usuario: Usuario }
  | { listo: false; paseIntermedio: string };

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

  const entrar = useCallback(async (email: string, password: string): Promise<ResultadoEntrar> => {
    const datos = await pedir<RespuestaAuth | RespuestaConCodigo>('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    });

    if ('requiereCodigo' in datos) {
      return { listo: false, paseIntermedio: datos.paseIntermedio };
    }

    guardarToken(datos.token);
    setUsuario(datos.usuario);
    return { listo: true, usuario: datos.usuario };
  }, []);

  const terminarConCodigo = useCallback(async (paseIntermedio: string, codigo: string) => {
    const datos = await pedir<RespuestaAuth>('/api/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio, codigo },
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
    () => ({ usuario, cargando, entrar, terminarConCodigo, registrar, salir, refrescar }),
    [usuario, cargando, entrar, terminarConCodigo, registrar, salir, refrescar],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error('useSesion debe usarse dentro de ProveedorSesion.');
  return valor;
}
