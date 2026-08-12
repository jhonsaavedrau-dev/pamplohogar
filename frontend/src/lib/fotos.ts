/**
 * Pide cada foto al tamano en que se va a ver, no al que tenga guardado.
 *
 * Antes la portada de una tarjeta pesaba lo mismo que la foto grande del
 * detalle: se descargaban 1400 pixeles de ancho para mostrarlos en 353. Eso
 * son cuatro o cinco veces mas datos de los necesarios, y aqui la mayoria
 * entra desde el celular pagando por megabyte.
 */

const ANCHOS = [400, 800, 1200, 1600] as const;

function urlCloudinary(url: string, ancho: number): string {
  // Se inserta la transformacion justo despues de /upload/
  return url.replace(
    '/image/upload/',
    `/image/upload/w_${ancho},c_limit,f_auto,q_auto:good/`,
  );
}

function urlUnsplash(url: string, ancho: number): string {
  const direccion = new URL(url);
  direccion.searchParams.set('w', String(ancho));
  direccion.searchParams.set('auto', 'format');
  direccion.searchParams.set('q', '70');
  return direccion.toString();
}

/** Devuelve la misma foto pedida al ancho indicado, si el servicio lo permite. */
export function fotoDeAncho(url: string, ancho: number): string {
  try {
    if (url.includes('res.cloudinary.com')) return urlCloudinary(url, ancho);
    if (url.includes('images.unsplash.com')) return urlUnsplash(url, ancho);
  } catch {
    /* Si la direccion es rara, se deja tal cual. */
  }
  return url;
}

/** Lista de tamanos para que el navegador elija el que le sirve. */
export function juegoDeAnchos(url: string): string | undefined {
  if (!url.includes('res.cloudinary.com') && !url.includes('images.unsplash.com')) {
    return undefined;
  }
  return ANCHOS.map((a) => `${fotoDeAncho(url, a)} ${a}w`).join(', ');
}
