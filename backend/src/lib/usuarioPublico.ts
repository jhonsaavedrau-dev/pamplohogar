import type { Usuario } from '@prisma/client';

export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  rol: Usuario['rol'];
  telefono: string | null;
  emailVerificado: boolean;
  foto: string | null;
  descripcion: string | null;
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
    emailVerificado: usuario.emailVerificadoEn !== null,
    foto: usuario.foto,
    descripcion: usuario.descripcion,
    creadoEn: usuario.creadoEn,
  };
}
