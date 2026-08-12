// Verifica que el freno de intentos vaya por cuenta y no solo por conexion.
//   node pruebas/prueba-intentos.mjs [direccion]
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = new PrismaClient({ log: ['error'] });

console.log(`Probando el freno de intentos contra ${BASE}\n`);

let ok = 0;
let fallas = 0;

async function probar(nombre, fn) {
  try {
    const r = await fn();
    console.log(`OK    ${nombre}${r ? ` -> ${r}` : ''}`);
    ok++;
  } catch (e) {
    console.log(`FALLA ${nombre} :: ${e.message}`);
    fallas++;
  }
}

async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let datos = null;
  try {
    datos = JSON.parse(texto);
  } catch {
    /* sin cuerpo */
  }
  return { estado: r.status, datos };
}

const exigir = (c, m) => {
  if (!c) throw new Error(m);
};

const suf = Math.floor(Math.random() * 999999);
const CLAVE = 'clave12345';
const correos = {
  victima: `int-vic-${suf}@test.com`,
  vecino: `int-vec-${suf}@test.com`,
};

const entrar = (email, password) => api('/auth/login', { metodo: 'POST', cuerpo: { email, password } });

/** Crea un enlace igual que el servidor, para probar sin depender del correo. */
async function enlaceDeCambio(usuarioId) {
  const token = randomBytes(32).toString('base64url');
  await prisma.tokenCorreo.create({
    data: {
      tokenHash: createHash('sha256').update(token).digest('hex'),
      tipo: 'RECUPERAR_CLAVE',
      usuarioId,
      expiraEn: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}

const fallarVeces = async (email, veces) => {
  for (let i = 0; i < veces; i++) {
    await entrar(email, 'esta-no-es-la-clave');
  }
};

try {
  for (const email of Object.values(correos)) {
    const r = await api('/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre: 'Ana Perez', email, password: CLAVE, rol: 'ESTUDIANTE' },
    });
    exigir(r.datos?.token, `no se pudo registrar ${email}: estado ${r.estado}`);
  }

  await probar('unos pocos errores no frenan la cuenta', async () => {
    await fallarVeces(correos.victima, 5);
    const r = await entrar(correos.victima, CLAVE);
    exigir(r.estado === 200, `estado ${r.estado}`);
    return 'equivocarse cinco veces no cuesta nada';
  });

  await probar('entrar bien borra los intentos acumulados', async () => {
    const u = await prisma.usuario.findUnique({ where: { email: correos.victima } });
    exigir(u.intentosFallidos === 0, `quedaron ${u.intentosFallidos} intentos anotados`);
  });

  await probar('a los diez errores seguidos la cuenta se frena', async () => {
    await fallarVeces(correos.victima, 10);
    const r = await entrar(correos.victima, CLAVE);
    exigir(r.estado === 429, `estado ${r.estado}`);
    return 'y ni siquiera con la contraseña correcta entra';
  });

  await probar('el mensaje dice cuanto falta y como salir', async () => {
    const r = await entrar(correos.victima, CLAVE);
    exigir(/\d+ minuto/.test(r.datos.mensaje), `mensaje: ${r.datos.mensaje}`);
    exigir(/contrase/i.test(r.datos.mensaje), 'no menciona recuperar la contrasena');
    return r.datos.mensaje;
  });

  await probar('frenar una cuenta no frena a las demás', async () => {
    const r = await entrar(correos.vecino, CLAVE);
    exigir(r.estado === 200, `estado ${r.estado}`);
    return 'el resto del campus sigue entrando con normalidad';
  });

  await probar('el contador vuelve a cero al frenar', async () => {
    const u = await prisma.usuario.findUnique({ where: { email: correos.victima } });
    exigir(u.intentosFallidos === 0, `quedaron ${u.intentosFallidos}`);
    exigir(u.bloqueadoHasta !== null, 'no quedo anotado el freno');
    return 'al vencer el freno tendra otros diez intentos, no uno';
  });

  await probar('cambiar la contraseña por correo levanta el freno', async () => {
    const pedido = await api('/auth/recuperar', {
      metodo: 'POST',
      cuerpo: { email: correos.victima },
    });
    exigir(pedido.estado === 200, `estado ${pedido.estado}`);

    // El enlace real va por correo. Aqui se arma uno equivalente a mano,
    // para no depender de que el envio funcione.
    const usuario = await prisma.usuario.findUnique({ where: { email: correos.victima } });
    const codigo = await enlaceDeCambio(usuario.id);
    const cambio = await api('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: codigo, password: CLAVE },
    });
    exigir(cambio.estado === 200, `estado ${cambio.estado}: ${cambio.datos?.mensaje}`);

    const r = await entrar(correos.victima, CLAVE);
    exigir(r.estado === 200, `despues de cambiarla, estado ${r.estado}`);
    return 'nadie queda encerrado fuera de su propia cuenta';
  });

  await probar('el freno vencido deja entrar sin hacer nada', async () => {
    await fallarVeces(correos.vecino, 10);
    const frenado = await entrar(correos.vecino, CLAVE);
    exigir(frenado.estado === 429, `estado ${frenado.estado}`);

    // Se adelanta el reloj poniendo el freno en el pasado, para no esperar
    // quince minutos de verdad en cada corrida.
    await prisma.usuario.update({
      where: { email: correos.vecino },
      data: { bloqueadoHasta: new Date(Date.now() - 1000) },
    });

    const r = await entrar(correos.vecino, CLAVE);
    exigir(r.estado === 200, `estado ${r.estado}`);
    return 'pasados los quince minutos vuelve a entrar solo';
  });
} finally {
  await prisma.usuario.deleteMany({ where: { email: { in: Object.values(correos) } } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
