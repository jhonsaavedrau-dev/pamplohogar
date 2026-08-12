// Verifica la entrada en dos pasos con app de autenticacion.
//   node pruebas/prueba-doble-factor.mjs [direccion]
import { createHmac } from 'node:crypto';

import { baseDeLaPrueba } from './baseDeLaPrueba.mjs';

const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const prisma = baseDeLaPrueba(RAIZ);

console.log(`Probando la entrada en dos pasos contra ${BASE}\n`);

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

// La misma cuenta que hace la app del celular, para poder probar sin celular.
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function desdeBase32(texto) {
  let bits = 0;
  let valor = 0;
  const bytes = [];
  for (const c of texto.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    valor = (valor << 5) | ALFABETO.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function codigoDeLaApp(clave, desfaseDePasos = 0) {
  const paso = Math.floor(Date.now() / 1000 / 30) + desfaseDePasos;
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(paso));
  const resumen = createHmac('sha1', desdeBase32(clave)).update(contador).digest();
  const d = resumen[resumen.length - 1] & 0x0f;
  const numero =
    ((resumen[d] & 0x7f) << 24) | (resumen[d + 1] << 16) | (resumen[d + 2] << 8) | resumen[d + 3];
  return String(numero % 1_000_000).padStart(6, '0');
}

const suf = Math.floor(Math.random() * 999999);
const CLAVE_CUENTA = 'clave12345';
const correo = `df-arr-${suf}@test.com`;

let token = '';
let claveDeLaApp = '';
let respaldos = [];

const entrar = () =>
  api('/auth/login', { metodo: 'POST', cuerpo: { email: correo, password: CLAVE_CUENTA } });

try {
  const reg = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Alfonso Rangel',
      email: correo,
      password: CLAVE_CUENTA,
      telefono: '3001112233',
      rol: 'ARRENDADOR',
    },
  });
  exigir(reg.datos?.token, `no se pudo registrar: estado ${reg.estado}`);
  token = reg.datos.token;

  await probar('empieza apagada', async () => {
    const r = await api('/auth/doble-factor', { token });
    exigir(r.datos.activada === false, 'salio activada de entrada');
  });

  await probar('sin sesión no se puede preparar', async () => {
    const r = await api('/auth/doble-factor/preparar', { metodo: 'POST' });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('preparar entrega la clave y el enlace para la app', async () => {
    const r = await api('/auth/doble-factor/preparar', {
      metodo: 'POST',
      token,
      cuerpo: { metodo: 'APP' },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.direccionParaLaApp.startsWith('otpauth://totp/'), 'enlace raro');
    exigir(r.datos.claveParaEscribir.includes(' '), 'la clave no viene en pedacitos');
    claveDeLaApp = r.datos.claveParaEscribir.replace(/\s/g, '');
    exigir(claveDeLaApp.length === 32, `clave de ${claveDeLaApp.length} caracteres`);
    return 'el enlace se toca en el celular y la app queda lista sola';
  });

  await probar('todavía no queda activada solo con preparar', async () => {
    const r = await api('/auth/doble-factor', { token });
    exigir(r.datos.activada === false, 'se activo sin comprobar el codigo');
    const login = await entrar();
    exigir(login.datos.token, 'ya esta pidiendo codigo sin haberla activado');
    return 'si no, quien deje la pantalla a medias quedaria por fuera';
  });

  await probar('un código inventado no la activa', async () => {
    const r = await api('/auth/doble-factor/activar', {
      metodo: 'POST',
      token,
      cuerpo: { codigo: '000000' },
    });
    exigir(r.estado === 400, `estado ${r.estado}`);
  });

  await probar('el código de la app SI la activa', async () => {
    const r = await api('/auth/doble-factor/activar', {
      metodo: 'POST',
      token,
      cuerpo: { codigo: codigoDeLaApp(claveDeLaApp) },
    });
    exigir(r.estado === 200, `estado ${r.estado}: ${JSON.stringify(r.datos)}`);
    respaldos = r.datos.codigosDeRespaldo;
    exigir(respaldos.length === 8, `dio ${respaldos.length} codigos de respaldo`);
    return `y entrega ${respaldos.length} códigos de respaldo, una sola vez`;
  });

  await probar('los códigos de respaldo no quedan legibles en la base', async () => {
    const guardados = await prisma.codigoRespaldo.findMany({
      where: { usuario: { email: correo } },
      select: { hash: true },
    });
    exigir(guardados.length === 8, `hay ${guardados.length}`);
    exigir(!guardados.some((g) => respaldos.includes(g.hash)), 'se guardaron en claro');
    return 'quien lea la base no puede entrar con ellos';
  });

  let pase = '';
  await probar('la contraseña sola ya no entra', async () => {
    const r = await entrar();
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.requiereCodigo === true, 'no pidio codigo');
    exigir(!r.datos.token, 'entrego la sesion completa');
    pase = r.datos.paseIntermedio;
    exigir(typeof pase === 'string' && pase.length > 20, 'no dio pase intermedio');
  });

  await probar('el pase intermedio NO sirve como sesión', async () => {
    const r = await api('/auth/yo', { token: pase });
    exigir(r.estado === 401, `estado ${r.estado}`);
    return 'aunque lo intercepten, no abre nada';
  });

  await probar('con un código malo no termina de entrar', async () => {
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: pase, codigo: '000000' },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar('el código que ya se gasto al activar lo dice claro', async () => {
    // Al activar se anota el codigo usado. Si entra en los mismos treinta
    // segundos, ese ya no vale, y decirle "incorrecto" lo dejaria mirando la
    // app sin entender que el numero esta bien.
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: pase, codigo: codigoDeLaApp(claveDeLaApp) },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
    exigir(/ya lo usaste/.test(r.datos.mensaje), `mensaje: ${r.datos.mensaje}`);
    return r.datos.mensaje;
  });

  await probar('con el código siguiente de la app SI entra', async () => {
    // El de la ventana siguiente: es el que la app muestra en unos segundos,
    // y entra por el margen que se le da al reloj.
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: pase, codigo: codigoDeLaApp(claveDeLaApp, 1) },
    });
    exigir(r.estado === 200, `estado ${r.estado}: ${JSON.stringify(r.datos)}`);
    exigir(r.datos.token, 'no entrego sesion');
    token = r.datos.token;
    const yo = await api('/auth/yo', { token });
    exigir(yo.estado === 200, `la sesion no sirve: ${yo.estado}`);
  });

  await probar('el mismo código no sirve dos veces', async () => {
    const codigo = codigoDeLaApp(claveDeLaApp);
    const primera = await entrar();
    const uno = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: primera.datos.paseIntermedio, codigo },
    });
    // Puede que el de la prueba anterior fuera el mismo intervalo; en ese caso
    // ya viene rechazado, que es justo lo que se quiere comprobar.
    const segunda = await entrar();
    const dos = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: segunda.datos.paseIntermedio, codigo },
    });
    exigir(dos.estado === 401, `el repetido entro con estado ${dos.estado}`);
    return uno.estado === 200 ? 'el primero entra, el repetido no' : 'ya venia usado y no entro';
  });

  await probar('un código de respaldo entra y se gasta', async () => {
    const primera = await entrar();
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: primera.datos.paseIntermedio, codigo: respaldos[0] },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);
    exigir(r.datos.usoCodigoDeRespaldo === true, 'no aviso que uso uno de respaldo');
    exigir(r.datos.codigosDeRespaldoSinUsar === 7, `quedan ${r.datos.codigosDeRespaldoSinUsar}`);

    const otra = await entrar();
    const repetido = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: otra.datos.paseIntermedio, codigo: respaldos[0] },
    });
    exigir(repetido.estado === 401, `el gastado entro con estado ${repetido.estado}`);
    return 'perder el celular no es perder la cuenta';
  });

  await probar('un pase intermedio de otra persona no sirve', async () => {
    const otro = `df-otro-${suf}@test.com`;
    const reg2 = await api('/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre: 'Otra Persona', email: otro, password: CLAVE_CUENTA, rol: 'ESTUDIANTE' },
    });
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: reg2.datos.token, codigo: codigoDeLaApp(claveDeLaApp) },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
    await prisma.usuario.deleteMany({ where: { email: otro } });
    return 'una sesion normal tampoco vale como pase intermedio';
  });

  await probar('los códigos fallidos frenan la cuenta, no la conexión', async () => {
    // Es el mismo freno del inicio de sesion: en el wifi de la universidad
    // todos comparten una direccion, y castigar la conexion dejaria a todo el
    // salon por fuera. Frenar la cuenta atacada no molesta a nadie mas.
    try {
      const primera = await entrar();
      for (let i = 0; i < 10; i++) {
        await api('/auth/login/codigo', {
          metodo: 'POST',
          cuerpo: { paseIntermedio: primera.datos.paseIntermedio, codigo: '000000' },
        });
      }

      // Con la cuenta frenada, ni siquiera pasa del primer tramo.
      const frenado = await entrar();
      exigir(frenado.estado === 429, `estado ${frenado.estado}`);
      exigir(/este correo/.test(frenado.datos.mensaje), `mensaje: ${frenado.datos.mensaje}`);
      return frenado.datos.mensaje;
} finally {
      // Se adelanta el reloj para no esperar quince minutos de verdad, y va en
      // finally para que un fallo aqui no tumbe las pruebas que siguen.
      await prisma.usuario.update({
        where: { email: correo },
        data: { bloqueadoHasta: null, intentosFallidos: 0 },
      });
    }
  });

  await probar('apagarla exige la contraseña', async () => {
    const mala = await api('/auth/doble-factor/apagar', {
      metodo: 'POST',
      token,
      cuerpo: { password: 'no-es-mi-clave' },
    });
    exigir(mala.estado === 400, `estado ${mala.estado}`);
    const sigue = await api('/auth/doble-factor', { token });
    exigir(sigue.datos.activada === true, 'se apago con la clave equivocada');
    return 'un celular prestado no basta para quitarla';
  });

  await probar('con la contraseña SI se apaga y se borran los respaldos', async () => {
    const r = await api('/auth/doble-factor/apagar', {
      metodo: 'POST',
      token,
      cuerpo: { password: CLAVE_CUENTA },
    });
    exigir(r.estado === 200, `estado ${r.estado}`);

    const quedan = await prisma.codigoRespaldo.count({ where: { usuario: { email: correo } } });
    exigir(quedan === 0, `quedaron ${quedan} codigos de respaldo`);

    const login = await entrar();
    exigir(login.datos.token, 'sigue pidiendo codigo despues de apagarla');
  });
    await probar('con el metodo de correo, entrar avisa si el correo no salio', async () => {
    await prisma.usuario.update({
      where: { email: correo },
      data: {
        metodoDobleFactor: 'CORREO',
        dobleFactorActivadoEn: new Date(),
        dobleFactorClave: null,
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    });

    const login = await entrar();
    exigir(login.datos.requiereCodigo === true, 'no pidio codigo');
    exigir(login.datos.metodo === 'CORREO', `metodo ${login.datos.metodo}`);
    // A una direccion de prueba el servicio de correo no entrega, y la pagina
    // lo dice en vez de dejar a la persona esperando algo que nunca llega.
    exigir(login.datos.correoEnviado === false, 'dijo que si salio el correo');
    return 'no deja a nadie esperando un correo que nunca va a llegar';
  });

  /** Pone un codigo conocido, como si acabara de llegar al correo. */
  const ponerCodigo = async (minutosDeVida = 10) => {
    const { createHash, randomInt } = await import('node:crypto');
    const codigo = String(randomInt(0, 1000000)).padStart(6, '0');
    await prisma.usuario.update({
      where: { email: correo },
      data: {
        codigoCorreoHash: createHash('sha256').update(codigo).digest('hex'),
        codigoCorreoExpira: new Date(Date.now() + minutosDeVida * 60 * 1000),
      },
    });
    return codigo;
  };

  await probar('el código del correo no queda legible en la base', async () => {
    const codigo = await ponerCodigo();
    const guardado = await prisma.usuario.findUnique({
      where: { email: correo },
      select: { codigoCorreoHash: true },
    });
    exigir(guardado.codigoCorreoHash !== codigo, 'el codigo quedo escrito tal cual');
    exigir(guardado.codigoCorreoHash.length === 64, 'no parece un resumen');
    return 'quien lea la base no puede entrar con el';
  });

  await probar('con el código del correo SI entra', async () => {
    const login = await entrar();
    const codigo = await ponerCodigo();
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: login.datos.paseIntermedio, codigo },
    });
    exigir(r.estado === 200, `estado ${r.estado}: ${JSON.stringify(r.datos)}`);
    exigir(r.datos.token, 'no entrego sesion');
  });

  await probar('el código del correo no sirve dos veces', async () => {
    const uno = await entrar();
    const codigo = await ponerCodigo();
    const primera = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: uno.datos.paseIntermedio, codigo },
    });
    exigir(primera.estado === 200, `la primera fallo: ${primera.estado}`);

    const dos = await entrar();
    const segunda = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: dos.datos.paseIntermedio, codigo },
    });
    exigir(segunda.estado === 401, `el repetido entro: ${segunda.estado}`);
    return 'se borra apenas se usa';
  });

  await probar('un código vencido lo dice, no dice que está mal', async () => {
    const login = await entrar();
    const codigo = await ponerCodigo(-1);
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: login.datos.paseIntermedio, codigo },
    });
    exigir(r.estado === 401, `estado ${r.estado}`);
    exigir(/venci/i.test(r.datos.mensaje), `mensaje: ${r.datos.mensaje}`);
    return 'si no, la persona busca un error de tecleo que no existe';
  });

  await probar('con el método de correo, un código de respaldo también entra', async () => {
    const { createHash } = await import('node:crypto');
    // Al apagar la verificacion se borraron todos, asi que se pone uno nuevo
    // como lo haria el servidor: guardando solo el resumen.
    const deRespaldo = 'AAAA11-BBBB22';
    const usuario = await prisma.usuario.findUnique({ where: { email: correo }, select: { id: true } });
    await prisma.codigoRespaldo.create({
      data: { usuarioId: usuario.id, hash: createHash('sha256').update(deRespaldo).digest('hex') },
    });
    await prisma.usuario.update({
      where: { email: correo },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });

    const login = await entrar();
    const r = await api('/auth/login/codigo', {
      metodo: 'POST',
      cuerpo: { paseIntermedio: login.datos.paseIntermedio, codigo: deRespaldo },
    });
    exigir(r.estado === 200, `estado ${r.estado}: ${r.datos?.mensaje}`);
    exigir(r.datos.usoCodigoDeRespaldo === true, 'no lo reconocio como de respaldo');
    return 'perder el acceso al correo tampoco es perder la cuenta';
  });

} finally {
  await prisma.usuario.deleteMany({ where: { email: { contains: `df-` } } });
  await prisma.$disconnect();
  console.log('\nDatos temporales eliminados.');
}

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
