import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSesion } from '../lib/sesion';
import type { Rol } from '../lib/tipos';
import { Cargando } from './Estados';

interface Props {
  children: ReactNode;
  roles?: Rol[];
}

export function RutaProtegida({ children, roles }: Props) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Revisando tu sesion..." />;

  if (!usuario) {
    return <Navigate to="/entrar" state={{ desde: ubicacion.pathname }} replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
