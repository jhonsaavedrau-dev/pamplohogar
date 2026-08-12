import { Router } from 'express';
import multer from 'multer';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion } from '../middleware/auth.js';
import { solicitudInvalida } from '../lib/errores.js';
import { cloudinaryConfigurado } from '../lib/env.js';
import { cloudinary } from '../lib/cloudinary.js';

export const rutasSubidas = Router();

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(new Error('Solo aceptamos imagenes JPG, PNG o WEBP.'));
      return;
    }
    cb(null, true);
  },
});

interface FotoSubida {
  url: string;
  publicId: string;
}

function subirABuffer(
  buffer: Buffer,
  carpeta = 'pamplohogar/inmuebles',
  transformacion: Record<string, unknown>[] = [
    { width: 1600, height: 1200, crop: 'limit', quality: 'auto:good' },
  ],
): Promise<FotoSubida> {
  return new Promise((resolver, rechazar) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder: carpeta,
        resource_type: 'image',
        transformation: transformacion,
      },
      (error, resultado) => {
        if (error || !resultado) {
          rechazar(new Error(error?.message ?? 'Cloudinary no devolvio una respuesta.'));
          return;
        }
        resolver({ url: resultado.secure_url, publicId: resultado.public_id });
      },
    );
    flujo.end(buffer);
  });
}

rutasSubidas.post(
  '/fotos',
  requiereSesion,
  requiereRol('ARRENDADOR', 'ADMIN'),
  subida.array('fotos', 10),
  asincrono(async (req, res) => {
    if (!cloudinaryConfigurado) {
      throw solicitudInvalida(
        'La subida de fotos no está configurada en el servidor. Avisa al administrador.',
      );
    }

    const archivos = req.files;
    if (!Array.isArray(archivos) || archivos.length === 0) {
      throw solicitudInvalida('No enviaste ninguna foto.');
    }

    const fotos = await Promise.all(archivos.map((a) => subirABuffer(a.buffer)));
    res.status(201).json({ fotos });
  }),
);

/**
 * La foto de perfil. Cualquiera con sesion puede subir la suya.
 *
 * Se recorta cuadrada y centrada en la cara, y se guarda pequena: una foto de
 * perfil se ve del tamano de una moneda y no tiene sentido gastarle datos a
 * nadie con una imagen de dos mil pixeles.
 */
rutasSubidas.post(
  '/foto-de-perfil',
  requiereSesion,
  subida.single('foto'),
  asincrono(async (req, res) => {
    if (!cloudinaryConfigurado) {
      throw solicitudInvalida(
        'La subida de fotos no está configurada en el servidor. Avisa al administrador.',
      );
    }
    if (!req.file) throw solicitudInvalida('No enviaste ninguna foto.');

    const foto = await subirABuffer(req.file.buffer, 'pamplohogar/perfiles', [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ]);

    res.status(201).json({ foto });
  }),
);
