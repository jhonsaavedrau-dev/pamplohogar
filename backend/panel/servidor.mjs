/*
  El panel de control de PamploHogar.

  Una pagina que se abre en el navegador y dice, en cristiano, como va la
  plataforma: cuanta gente se ha registrado, cuantos inmuebles hay publicados,
  cuantos mensajes se han escrito y que paso en los ultimos dias.

  POR QUE VIVE AQUI Y NO DENTRO DE LA PLATAFORMA. La plataforma ya tiene una
  pantalla de administracion, pero esa la sirve internet y hay que entrar con
  usuario y clave. Esta corre en el computador de Jhon y en ningun otro sitio:
  se abre con doble clic, se apaga cerrando la ventana, y no hay nada publicado
  que alguien pueda encontrar.

  SOLO ESCUCHA EN 127.0.0.1. Eso quiere decir que la pagina solo existe para el
  computador donde corre. Ni el vecino del wifi ni nadie en internet puede
  abrirla, aunque supiera el numero del puerto.

  Uso:  npm run panel     (o doble clic en PANEL.bat)
*/
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PUERTO = 4321;

/* --------------------------------------------------------- la conexion */

/**
 * Saca la direccion de la base de un archivo .env, con o sin comillas.
 */
function leerUrl(archivo) {
  const ruta = join(AQUI, '..', archivo);
  if (!existsSync(ruta)) return null;
  const linea = readFileSync(ruta, 'utf8')
    .split(/\r?\n/)
    .find((l) => !l.trimStart().startsWith('#') && l.trimStart().startsWith('DATABASE_URL='));
  if (!linea) return null;
  const valor = linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor && !valor.includes('PEGA-AQUI') ? valor : null;
}

/*
  Prefiere la base de internet si esta configurada, y si no, la de pruebas.
  Asi el panel sirve para mirar la plataforma de verdad cuando hace falta y
  para probarlo sin riesgo cuando no.
*/
const urlInternet = leerUrl('.env.produccion');
const urlPruebas = leerUrl('.env');
const url = urlInternet ?? urlPruebas;
const CUAL = urlInternet ? 'INTERNET' : 'PRUEBAS';

if (!url) {
  process.stderr.write(
    '\nNo encontre a que base conectarme.\n\n' +
      'Para mirar la plataforma de internet, crea el archivo\n' +
      '  backend/.env.produccion\n' +
      'con una sola linea:\n' +
      '  DATABASE_URL=<lo que sale en Render, en pamplohogar-api, pestana Environment>\n\n',
  );
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

/* ------------------------------------------------------------ los datos */

const haceDias = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/** Las cuentas de mentiras no cuentan como gente. */
const DE_VERDAD = {
  AND: [
    { email: { not: { endsWith: '@ejemplo.com' } } },
    { email: { not: { endsWith: '@test.com' } } },
  ],
};

async function reunirDatos() {
  const semana = haceDias(7);
  const mes = haceDias(30);

  const [
    usuarios, usuariosSemana, estudiantes, arrendadores,
    inmuebles, inmueblesActivos, inmueblesSemana,
    mensajes, mensajesSemana, conversaciones,
    favoritos, resenas, opinionesBarrio, roomies,
    ultimosUsuarios, ultimosInmuebles, porBarrio,
  ] = await Promise.all([
    prisma.usuario.count({ where: DE_VERDAD }),
    prisma.usuario.count({ where: { ...DE_VERDAD, creadoEn: { gte: semana } } }),
    prisma.usuario.count({ where: { ...DE_VERDAD, rol: 'ESTUDIANTE' } }),
    prisma.usuario.count({ where: { ...DE_VERDAD, rol: 'ARRENDADOR' } }),
    prisma.inmueble.count(),
    prisma.inmueble.count({ where: { activo: true } }),
    prisma.inmueble.count({ where: { creadoEn: { gte: semana } } }),
    prisma.mensaje.count(),
    prisma.mensaje.count({ where: { creadoEn: { gte: semana } } }),
    prisma.conversacion.count(),
    prisma.favorito.count(),
    prisma.resena.count(),
    prisma.resenaBarrio.count(),
    prisma.perfilRoomie.count(),
    prisma.usuario.findMany({
      where: DE_VERDAD,
      orderBy: { creadoEn: 'desc' },
      take: 12,
      select: { nombre: true, email: true, rol: true, creadoEn: true, emailVerificadoEn: true },
    }),
    prisma.inmueble.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 12,
      select: {
        id: true, titulo: true, barrio: true, precio: true, tipo: true,
        activo: true, creadoEn: true,
        arrendador: { select: { nombre: true, email: true } },
      },
    }),
    prisma.inmueble.groupBy({ by: ['barrio'], _count: true, orderBy: { _count: { barrio: 'desc' } } }),
  ]);

  // Registros por dia del ultimo mes, para el grafico.
  const delMes = await prisma.usuario.findMany({
    where: { ...DE_VERDAD, creadoEn: { gte: mes } },
    select: { creadoEn: true },
  });
  const porDia = {};
  for (let i = 29; i >= 0; i--) {
    porDia[haceDias(i).toISOString().slice(0, 10)] = 0;
  }
  for (const u of delMes) {
    const d = u.creadoEn.toISOString().slice(0, 10);
    if (d in porDia) porDia[d] += 1;
  }

  return {
    cual: CUAL,
    usuarios, usuariosSemana, estudiantes, arrendadores,
    inmuebles, inmueblesActivos, inmueblesSemana,
    mensajes, mensajesSemana, conversaciones,
    favoritos, resenas, opinionesBarrio, roomies,
    ultimosUsuarios, ultimosInmuebles,
    porBarrio: porBarrio.slice(0, 12),
    porDia,
    momento: new Date().toLocaleString('es-CO'),
  };
}

/* ------------------------------------------------------------- la pagina */

const pesos = (n) => '$ ' + n.toLocaleString('es-CO');

const cuando = (fecha) => {
  const horas = (Date.now() - new Date(fecha).getTime()) / 36e5;
  if (horas < 1) return 'hace un rato';
  if (horas < 24) return `hace ${Math.round(horas)} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
};

const escapar = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function tarjeta(numero, titulo, pie, destacada = false) {
  return `<div class="tarjeta${destacada ? ' fuerte' : ''}">
    <div class="numero">${numero}</div>
    <div class="titulo">${titulo}</div>
    ${pie ? `<div class="pie">${pie}</div>` : ''}
  </div>`;
}

function grafico(porDia) {
  const valores = Object.values(porDia);
  const tope = Math.max(1, ...valores);
  const barras = Object.entries(porDia)
    .map(([dia, n]) => {
      const alto = Math.round((n / tope) * 100);
      return `<div class="barra" title="${dia}: ${n}">
        <div class="relleno" style="height:${Math.max(alto, n > 0 ? 8 : 2)}%"></div>
      </div>`;
    })
    .join('');
  return `<div class="grafico">${barras}</div>
    <div class="ejes"><span>hace 30 días</span><span>hoy</span></div>`;
}

function pagina(d) {
  const enPruebas = d.cual === 'PRUEBAS';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Panel · PamploHogar</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{--crema:#FFF7F0;--piedra:#1F1B17;--gris:#655E52;--terracota:#B25317;--suave:#EDE7DE}
  *{box-sizing:border-box}
  body{margin:0;background:var(--crema);color:var(--piedra);
       font:16px/1.5 'Segoe UI',system-ui,sans-serif}
  .caja{max-width:1100px;margin:0 auto;padding:32px 24px 64px}
  header{display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:space-between;
         margin-bottom:8px}
  h1{font-size:34px;margin:0;letter-spacing:-1px}
  .momento{font-size:14px;color:var(--gris)}
  .aviso{margin:16px 0 28px;padding:12px 16px;border-radius:12px;font-size:15px;
         background:${enPruebas ? '#FDF6F1' : '#F3F7F3'};
         border:2px solid ${enPruebas ? '#F2CCB0' : '#CADCCA'}}
  h2{font-size:15px;letter-spacing:3px;text-transform:uppercase;color:var(--gris);
     margin:36px 0 14px;font-weight:700}
  .rejilla{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
  .tarjeta{background:#fff;border:2px solid rgba(31,27,23,.07);border-radius:16px;padding:20px}
  .tarjeta.fuerte{background:var(--terracota);border-color:var(--terracota);color:#fff}
  .numero{font-size:44px;font-weight:800;letter-spacing:-2px;line-height:1.1}
  .titulo{font-size:15px;font-weight:700;margin-top:2px}
  .pie{font-size:14px;color:var(--gris);margin-top:4px}
  .tarjeta.fuerte .pie{color:rgba(255,255,255,.85)}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden;
        border:2px solid rgba(31,27,23,.07)}
  th{text-align:left;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gris);
     padding:12px 16px;background:#FBF7F2}
  td{padding:12px 16px;border-top:1px solid var(--suave);font-size:15px}
  .apagado{color:var(--gris);font-size:14px}
  .etiqueta{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;
            background:var(--suave);color:var(--gris)}
  .etiqueta.si{background:#E8F0E8;color:#3B6B3B}
  .etiqueta.no{background:#FBEBE3;color:var(--terracota)}
  .grafico{display:flex;align-items:flex-end;gap:3px;height:110px;background:#fff;padding:12px;
           border-radius:16px;border:2px solid rgba(31,27,23,.07)}
  .barra{flex:1;display:flex;align-items:flex-end;height:100%}
  .relleno{width:100%;background:var(--terracota);border-radius:3px;min-height:2px}
  .ejes{display:flex;justify-content:space-between;font-size:13px;color:var(--gris);margin-top:6px}
  .botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px}
  .boton{display:inline-block;padding:12px 20px;border-radius:12px;text-decoration:none;
         font-weight:700;font-size:15px;background:#fff;color:var(--piedra);
         border:2px solid rgba(31,27,23,.12)}
  .boton.principal{background:var(--terracota);color:#fff;border-color:var(--terracota)}
</style></head><body><div class="caja">

<header>
  <h1>Panel de PamploHogar</h1>
  <div class="momento">Actualizado ${d.momento} · se refresca solo cada minuto</div>
</header>

<div class="aviso">
  ${enPruebas
    ? '<b>Estás viendo la base de PRUEBAS</b>, la de tu computador. Para ver la de internet, crea <code>backend/.env.produccion</code> con la dirección que sale en Render.'
    : '<b>Estás viendo la plataforma de internet.</b> Estos son los números de verdad, ahora mismo.'}
</div>

<h2>La gente</h2>
<div class="rejilla">
  ${tarjeta(d.usuarios, 'Cuentas creadas', `${d.usuariosSemana} esta semana`, true)}
  ${tarjeta(d.estudiantes, 'Estudiantes', 'buscan dónde vivir')}
  ${tarjeta(d.arrendadores, 'Arrendadores', 'publican')}
  ${tarjeta(d.roomies, 'Perfiles de roomie', 'buscan con quién compartir')}
</div>
<h2>Registros de los últimos 30 días</h2>
${grafico(d.porDia)}

<h2>Las publicaciones</h2>
<div class="rejilla">
  ${tarjeta(d.inmueblesActivos, 'Inmuebles a la vista', `${d.inmuebles} en total`, true)}
  ${tarjeta(d.inmueblesSemana, 'Publicados esta semana', '')}
  ${tarjeta(d.favoritos, 'Guardados en favoritos', '')}
  ${tarjeta(d.resenas + d.opinionesBarrio, 'Opiniones escritas', `${d.resenas} de arrendador, ${d.opinionesBarrio} de barrio`)}
</div>

<h2>Las conversaciones</h2>
<div class="rejilla">
  ${tarjeta(d.conversaciones, 'Conversaciones abiertas', '', true)}
  ${tarjeta(d.mensajes, 'Mensajes escritos', `${d.mensajesSemana} esta semana`)}
</div>

<h2>Quién se registró último</h2>
<table><tr><th>Nombre</th><th>Correo</th><th>Es</th><th>Correo confirmado</th><th>Cuándo</th></tr>
${d.ultimosUsuarios.map((u) => `<tr>
  <td>${escapar(u.nombre)}</td>
  <td class="apagado">${escapar(u.email)}</td>
  <td><span class="etiqueta">${u.rol === 'ESTUDIANTE' ? 'estudiante' : u.rol === 'ARRENDADOR' ? 'arrendador' : 'admin'}</span></td>
  <td>${u.emailVerificadoEn ? '<span class="etiqueta si">sí</span>' : '<span class="etiqueta no">todavía no</span>'}</td>
  <td class="apagado">${cuando(u.creadoEn)}</td>
</tr>`).join('') || '<tr><td colspan="5" class="apagado">Todavía no se ha registrado nadie.</td></tr>'}
</table>

<h2>Lo último publicado</h2>
<table><tr><th>Qué</th><th>Barrio</th><th>Precio</th><th>Quién</th><th>Estado</th><th>Cuándo</th></tr>
${d.ultimosInmuebles.map((i) => `<tr>
  <td>${escapar(i.titulo.slice(0, 46))}${i.titulo.length > 46 ? '…' : ''}</td>
  <td>${escapar(i.barrio)}</td>
  <td><b>${pesos(i.precio)}</b></td>
  <td class="apagado">${escapar(i.arrendador.nombre)}</td>
  <td>${i.activo ? '<span class="etiqueta si">a la vista</span>' : '<span class="etiqueta no">oculto</span>'}</td>
  <td class="apagado">${cuando(i.creadoEn)}</td>
</tr>`).join('') || '<tr><td colspan="6" class="apagado">Todavía no hay nada publicado.</td></tr>'}
</table>

<h2>En qué barrios hay algo</h2>
<table><tr><th>Barrio</th><th>Inmuebles</th></tr>
${d.porBarrio.map((b) => `<tr><td>${escapar(b.barrio)}</td><td><b>${b._count}</b></td></tr>`).join('')
  || '<tr><td colspan="2" class="apagado">Todavía nada.</td></tr>'}
</table>

<div class="botones">
  <a class="boton principal" href="https://pamplohogar.com" target="_blank">Abrir la plataforma</a>
  <a class="boton" href="/refrescar">Actualizar ahora</a>
</div>

<p class="apagado" style="margin-top:28px">
  Para <b>cambiar</b> datos —borrar una publicación, corregir un correo, quitar una reseña—
  cierra esta ventana y abre el editor de la base con <code>npm run datos</code>.
  Ahí se toca todo con el ratón, tabla por tabla.
</p>

</div>
<script>setTimeout(() => location.reload(), 60000);</script>
</body></html>`;
}

/* ------------------------------------------------------------ el servidor */

const servidor = createServer(async (peticion, respuesta) => {
  if (peticion.url === '/favicon.ico') {
    respuesta.writeHead(204).end();
    return;
  }
  try {
    const datos = await reunirDatos();
    respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    respuesta.end(pagina(datos));
  } catch (error) {
    respuesta.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    respuesta.end(
      `<body style="font:16px system-ui;padding:40px;background:#FFF7F0">
       <h1>No pude leer la base de datos</h1>
       <p>${escapar(error.message)}</p>
       <p style="color:#655E52">Si dice que no puede conectarse, puede ser que el servidor
       gratuito de Render este dormido: espera medio minuto y actualiza.</p></body>`,
    );
  }
});

// Solo 127.0.0.1: la pagina existe unicamente para este computador.
servidor.listen(PUERTO, '127.0.0.1', () => {
  process.stdout.write(
    `\n  Panel de PamploHogar\n` +
      `  Mirando la base de ${CUAL}\n\n` +
      `  Abre esto en el navegador:  http://localhost:${PUERTO}\n\n` +
      `  Para apagarlo, cierra esta ventana.\n\n`,
  );
});
