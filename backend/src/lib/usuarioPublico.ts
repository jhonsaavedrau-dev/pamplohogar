import type { Usuario } from '@prisma/client';

export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  rol: Usuario['rol'];
  telefono: string | null;
  creadoEn: Date;
}

/** Quita la contrasena y cualquier campo sensible antes de responder. */
export function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    telefono: usuario.telefono,
    creadoEn: usuario.creadoEn,
  };
}
