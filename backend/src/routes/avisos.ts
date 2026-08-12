import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asincrono } from '../middleware/asincrono.js';
import { noAutorizado } from '../lib/errores.js';
import { env, origenesPermitidos } from '../lib/env.js';
import { correoConfigurado, correoDeNovedades, enviarCorreo } from '../lib/correo.js';
import { novedadesDe } from '../lib/coincidencias.js';

export const rutasAvisos = Router();

/**
 * Manda los avisos de las busquedas guardadas.
 *
 * No lo llama una persona sino una tarea programada, asi que se protege con
 * una clave propia y no con sesion. Sin la clave configurada la ruta no
 * existe: mejor que quede muda a que quede abierta.
 */
rutasAvisos.post(
  '/enviar',
  asincrono(async (req, res) => {
    if (env.CLAVE_AVISOS === '') {
      throw noAutorizado('Los avisos no están configurados en este servidor.');
    }

    const cabecera = req.headers.authorization ?? '';
    const clave = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
    if (clave !== env.CLAVE_AVISOS) {
      throw noAutorizado('Clave incorrecta.');
    }

    if (!correoConfigurado) {
      res.json({ revisadas: 0, avisosEnviados: 0, motivo: 'El correo no está configurado.' });
      return;
    }

    const base = origenesPermitidos[0] ?? 'http://localhost:5173';

    const busquedas = await prisma.busquedaGuardada.findMany({
      where: { avisarPorCorreo: true },
      include: { usuario: { select: { email: true, nombre: true } } },
    });

    let enviados = 0;
    let conNovedades = 0;
    const ahora = new Date();

    for (const busqueda of busquedas) {
      const nuevos = await novedadesDe(busqueda);

      if (nuevos.length === 0) {
        // Igual se adelanta la marca: si no hubo nada, no hay por que volver
        // a revisar ese mismo tramo de tiempo manana.
        await prisma.busquedaGuardada.update({
          where: { id: busqueda.id },
          data: { revisadaHasta: ahora },
        });
        continue;
      }

      conNovedades += 1;

      const seEnvio = await enviarCorreo(
        correoDeNovedades(
          busqueda.usuario.email,
          busqueda.usuario.nombre.split(' ')[0],
          busqueda.nombre,
          nuevos.map((i) => ({
            titulo: i.titulo,
            precio: i.precio,
            barrio: i.barrio,
            enlace: `${base}/inmueble/${i.id}`,
          })),
          `${base}/busquedas`,
        ),
      );

      if (seEnvio) {
        enviados += 1;
        // La marca solo avanza si el correo salio. Si fallo, manana se
        // vuelve a intentar con las mismas novedades en vez de perderlas.
        await prisma.busquedaGuardada.update({
          where: { id: busqueda.id },
          data: { revisadaHasta: ahora, ultimoAvisoEn: ahora },
        });
      }
    }

    res.json({
      revisadas: busquedas.length,
      conNovedades,
      avisosEnviados: enviados,
    });
  }),
);
