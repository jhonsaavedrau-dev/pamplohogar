import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { origenesPermitidos } from './lib/env.js';
import { manejadorDeErrores, rutaNoEncontrada } from './middleware/errores.js';
import { rutasAuth } from './routes/auth.js';
import { rutasInmuebles } from './routes/inmuebles.js';
import { rutasFavoritos } from './routes/favoritos.js';
import { rutasResenas } from './routes/resenas.js';
import { rutasContacto } from './routes/contacto.js';
import { rutasSubidas } from './routes/subidas.js';
import { rutasAdmin } from './routes/admin.js';
import { rutasReportes } from './routes/reportes.js';
import { prisma } from './lib/prisma.js';

export function crearApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origen, callback) => {
        if (!origen) return callback(null, true);
        const limpio = origen.replace(/\/$/, '');
        if (origenesPermitidos.includes(limpio)) return callback(null, true);
        callback(new Error('Origen no permitido por CORS.'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/salud', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ estado: 'ok', baseDeDatos: 'conectada', servicio: 'PamploHogar API' });
    } catch {
      res.status(503).json({ estado: 'degradado', baseDeDatos: 'sin conexion' });
    }
  });

  app.use('/api/auth', rutasAuth);
  app.use('/api/inmuebles', rutasInmuebles);
  app.use('/api/favoritos', rutasFavoritos);
  app.use('/api/resenas', rutasResenas);
  app.use('/api/subidas', rutasSubidas);
  app.use('/api/admin', rutasAdmin);
  app.use('/api', rutasContacto);
  app.use('/api', rutasReportes);

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
