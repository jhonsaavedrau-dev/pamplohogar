const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const CLAVE_TOKEN = 'pamplohogar.token';

export function guardarToken(token: string): void {
  window.localStorage.setItem(CLAVE_TOKEN, token);
}

export function leerToken(): string | null {
  return window.localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken(): void {
  window.localStorage.removeItem(CLAVE_TOKEN);
}

type Aviso = () => void;
const avisosDeSesionPerdida = new Set<Aviso>();

/**
 * Permite que la aplicacion se entere cuando el servidor rechaza la sesion.
 * Sin esto la pantalla queda mostrando al usuario como si siguiera dentro,
 * mientras cada peticion falla por detras.
 */
export function alPerderSesion(aviso: Aviso): () => void {
  avisosDeSesionPerdida.add(aviso);
  return () => avisosDeSesionPerdida.delete(aviso);
}

function anunciarSesionPerdida(): void {
  borrarToken();
  avisosDeSesionPerdida.forEach((aviso) => aviso());
}

/** Error con el mensaje en espanol que devolvio el servidor. */
export class ErrorApi extends Error {
  readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  formulario?: FormData;
}

export async function pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, formulario } = opciones;

  const cabeceras: Record<string, string> = {};
  const token = leerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: formulario ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined),
    });
  } catch {
    throw new ErrorApi(0, 'No pudimos conectarnos. Revisa tu internet e intenta de nuevo.');
  }

  if (respuesta.status === 204) return undefined as T;

  let datos: unknown = null;
  const texto = await respuesta.text();
  if (texto.length > 0) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const mensaje =
      datos !== null && typeof datos === 'object' && 'mensaje' in datos
        ? String((datos as { mensaje: unknown }).mensaje)
        : 'Algo salio mal. Intenta de nuevo.';
    if (respuesta.status === 401) anunciarSesionPerdida();
    throw new ErrorApi(respuesta.status, mensaje);
  }

  return datos as T;
}
