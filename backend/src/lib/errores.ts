/** Error con mensaje pensado para mostrarse al usuario final, en espanol. */
export class ErrorApi extends Error {
  readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

export const noAutorizado = (mensaje = 'Debes iniciar sesion para hacer esto.') =>
  new ErrorApi(401, mensaje);

export const prohibido = (mensaje = 'No tienes permiso para hacer esto.') =>
  new ErrorApi(403, mensaje);

export const noEncontrado = (mensaje = 'No encontramos lo que buscabas.') =>
  new ErrorApi(404, mensaje);

export const solicitudInvalida = (mensaje = 'Revisa los datos que enviaste.') =>
  new ErrorApi(400, mensaje);

export const conflicto = (mensaje = 'Ese registro ya existe.') => new ErrorApi(409, mensaje);
