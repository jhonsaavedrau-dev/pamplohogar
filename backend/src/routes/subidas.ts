import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asincrono } from '../middleware/asincrono.js';
import { requiereRol, requiereSesion } from '../middleware/auth.js';
import { solicitudInvalida } from '../lib/errores.js';
import { cloudinaryConfigurado, env } from '../lib/env.js';

export const rutasSubidas = Router();

if (cloudinaryConfigurado) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

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

function subirABuffer(buffer: Buffer): Promise<FotoSubida> {
  return new Promise((resolver, rechazar) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder: 'pamplohogar/inmuebles',
        resource_type: 'image',
        transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto:good' }],
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
        'La subida de fotos no esta configurada en el servidor. Avisa al administrador.',
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
