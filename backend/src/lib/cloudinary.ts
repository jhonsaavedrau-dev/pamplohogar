import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfigurado, env } from './env.js';

if (cloudinaryConfigurado) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

/** Las fotos de la semilla apuntan a Unsplash, no hay nada que borrar alla. */
const esDeLaSemilla = (publicId: string): boolean => publicId.startsWith('semilla/');

/**
 * Borra fotos de Cloudinary sin tumbar la peticion si algo falla.
 *
 * Que una foto vieja quede colgada es un problema de espacio, no del usuario:
 * si el borrado falla, el inmueble igual queda bien guardado y solo se anota
 * en el log del servidor.
 */
export async function borrarFotos(publicIds: string[]): Promise<void> {
  if (!cloudinaryConfigurado) return;

  const borrables = publicIds.filter((id) => id.length > 0 && !esDeLaSemilla(id));
  if (borrables.length === 0) return;

  const resultados = await Promise.allSettled(
    borrables.map((id) => cloudinary.uploader.destroy(id, { resource_type: 'image' })),
  );

  const fallidas = resultados.filter((r) => r.status === 'rejected').length;
  if (fallidas > 0) {
    process.stderr.write(
      `[PamploHogar] No se pudieron borrar ${fallidas} de ${borrables.length} fotos en Cloudinary.\n`,
    );
  }
}
