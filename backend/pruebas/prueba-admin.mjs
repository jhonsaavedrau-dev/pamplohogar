// Verifica el panel de administrador y, sobre todo, que nadie mas pueda entrar.
//   node pruebas/prueba-admin.mjs [direccion] [correoAdmin] [claveAdmin]
const RAIZ = (process.argv[2] ?? 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${RAIZ}/api`;
const ADMIN_EMAIL = process.argv[3] ?? 'admin.prueba@pamplohogar.com';
const ADMIN_CLAVE = process.argv[4] ?? 'adminprueba123';

console.log(`Probando el panel contra ${BASE}\n`);

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
  return { estado: r.estado ?? r.status, datos };
}

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

const suf = Math.floor(Math.random() * 999999);
let tokenAdmin = '';
let tokenEstudiante = '';
let tokenArrendador = '';
let idEstudiante = '';
let idAdmin = '';

await probar('el administrador puede entrar', async () => {
  const r = await api('/auth/login', {
    metodo: 'POST',
    cuerpo: { email: ADMIN_EMAIL, password: ADMIN_CLAVE },
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
  exigir(r.datos.usuario.rol === 'ADMIN', `su rol es ${r.datos.usuario.rol}`);
  tokenAdmin = r.datos.token;
  idAdmin = r.datos.usuario.id;
});

await probar('se crean cuentas normales para las pruebas', async () => {
  const est = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Estudiante Panel',
      email: `panel-est${suf}@test.com`,
      password: 'clave12345',
      rol: 'ESTUDIANTE',
    },
  });
  const arr = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      nombre: 'Arrendador Panel',
      email: `panel-arr${suf}@test.com`,
      password: 'clave12345',
      telefono: '3009998877',
      rol: 'ARRENDADOR',
    },
  });
  exigir(est.estado === 201 && arr.estado === 201, 'no se crearon');
  tokenEstudiante = est.datos.token;
  idEstudiante = est.datos.usuario.id;
  tokenArrendador = arr.datos.token;
});

console.log('\n--- lo que de verdad importa: que el panel este cerrado ---');

const RUTAS_PANEL = [
  '/admin/resumen',
  '/admin/inmuebles',
  '/admin/usuarios',
  '/admin/resenas',
];

for (const ruta of RUTAS_PANEL) {
  await probar(`sin sesion, ${ruta} devuelve 401`, async () => {
    const r = await api(ruta);
    exigir(r.estado === 401, `estado ${r.estado}`);
  });

  await probar(`un estudiante en ${ruta} devuelve 403`, async () => {
    const r = await api(ruta, { token: tokenEstudiante });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });

  await probar(`un arrendador en ${ruta} devuelve 403`, async () => {
    const r = await api(ruta, { token: tokenArrendador });
    exigir(r.estado === 403, `estado ${r.estado}`);
  });
}

await probar('un estudiante no puede cambiarle el rol a nadie', async () => {
  const r = await api(`/admin/usuarios/${idEstudiante}/rol`, {
    metodo: 'PATCH',
    token: tokenEstudiante,
    cuerpo: { rol: 'ARRENDADOR' },
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

await probar('un estudiante no puede borrar cuentas', async () => {
  const r = await api(`/admin/usuarios/${idAdmin}`, {
    metodo: 'DELETE',
    token: tokenEstudiante,
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
});

console.log('\n--- y que el administrador si pueda trabajar ---');

await probar('el resumen trae los numeros', async () => {
  const r = await api('/admin/resumen', { token: tokenAdmin });
  exigir(r.estado === 200, `estado ${r.estado}`);
  const d = r.datos;
  exigir(typeof d.usuarios.estudiantes === 'number', 'sin conteo de estudiantes');
  exigir(typeof d.inmuebles.activos === 'number', 'sin conteo de inmuebles');
  return `${d.inmuebles.activos} activos, ${d.usuarios.arrendadores} arrendadores, promedio ${d.precios.promedio}`;
});

await probar('lista los inmuebles con datos de moderacion', async () => {
  const r = await api('/admin/inmuebles', { token: tokenAdmin });
  exigir(r.estado === 200, `estado ${r.estado}`);
  const primero = r.datos.inmuebles[0];
  exigir(primero.arrendador.email !== undefined, 'no trae el correo del arrendador');
  exigir(typeof primero.solicitudes === 'number', 'no trae cuantas solicitudes tuvo');
  return `${r.datos.total} inmuebles`;
});

await probar('puede filtrar solo los ocultos', async () => {
  const r = await api('/admin/inmuebles?estado=ocultos', { token: tokenAdmin });
  const visibles = r.datos.inmuebles.filter((i) => i.activo);
  exigir(visibles.length === 0, 'devolvio inmuebles visibles');
  return `${r.datos.total} ocultos`;
});

await probar('puede buscar por nombre del arrendador', async () => {
  const r = await api('/admin/inmuebles?q=Marta', { token: tokenAdmin });
  exigir(r.estado === 200, `estado ${r.estado}`);
  return `${r.datos.total} resultados`;
});

await probar('lista los usuarios con cuanto publico cada uno', async () => {
  const r = await api('/admin/usuarios', { token: tokenAdmin });
  exigir(r.estado === 200, `estado ${r.estado}`);
  exigir(r.datos.usuarios[0].inmuebles !== undefined, 'no dice cuantos inmuebles tiene');
  const conClave = JSON.stringify(r.datos).includes('passwordHash');
  exigir(!conClave, 'FUGA: devolvio contrasenas');
  return `${r.datos.total} usuarios, ninguna contrasena expuesta`;
});

await probar('puede filtrar usuarios por rol', async () => {
  const r = await api('/admin/usuarios?rol=ARRENDADOR', { token: tokenAdmin });
  const otros = r.datos.usuarios.filter((u) => u.rol !== 'ARRENDADOR');
  exigir(otros.length === 0, 'devolvio otros roles');
  return `${r.datos.total} arrendadores`;
});

await probar('puede cambiar a un estudiante a arrendador', async () => {
  const r = await api(`/admin/usuarios/${idEstudiante}/rol`, {
    metodo: 'PATCH',
    token: tokenAdmin,
    cuerpo: { rol: 'ARRENDADOR' },
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
  exigir(r.datos.usuario.rol === 'ARRENDADOR', 'no cambio');
});

await probar('NO puede nombrar administradores desde la pagina', async () => {
  const r = await api(`/admin/usuarios/${idEstudiante}/rol`, {
    metodo: 'PATCH',
    token: tokenAdmin,
    cuerpo: { rol: 'ADMIN' },
  });
  exigir(r.estado === 400, `estado ${r.estado}`);
  return r.datos.mensaje;
});

await probar('NO puede cambiarse el rol a si mismo', async () => {
  const r = await api(`/admin/usuarios/${idAdmin}/rol`, {
    metodo: 'PATCH',
    token: tokenAdmin,
    cuerpo: { rol: 'ESTUDIANTE' },
  });
  exigir(r.estado === 403, `estado ${r.estado}`);
  return r.datos.mensaje;
});

await probar('NO puede eliminarse a si mismo', async () => {
  const r = await api(`/admin/usuarios/${idAdmin}`, { metodo: 'DELETE', token: tokenAdmin });
  exigir(r.estado === 403, `estado ${r.estado}`);
  return r.datos.mensaje;
});

await probar('puede ocultar cualquier inmueble, no solo los suyos', async () => {
  const lista = await api('/admin/inmuebles?estado=activos', { token: tokenAdmin });
  const objetivo = lista.datos.inmuebles[0];
  const r = await api(`/inmuebles/${objetivo.id}`, {
    metodo: 'PATCH',
    token: tokenAdmin,
    cuerpo: { activo: false },
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
  await api(`/inmuebles/${objetivo.id}`, {
    metodo: 'PATCH',
    token: tokenAdmin,
    cuerpo: { activo: true },
  });
  return 'oculto y restaurado';
});

await probar('puede eliminar cuentas abusivas', async () => {
  const r = await api(`/admin/usuarios/${idEstudiante}`, {
    metodo: 'DELETE',
    token: tokenAdmin,
  });
  exigir(r.estado === 200, `estado ${r.estado}`);
});

await probar('lista las resenas para moderarlas', async () => {
  const r = await api('/admin/resenas', { token: tokenAdmin });
  exigir(r.estado === 200, `estado ${r.estado}`);
  return `${r.datos.resenas.length} resenas`;
});

console.log('\n=================================');
console.log(`RESULTADO: ${ok} pruebas pasaron, ${fallas} fallaron`);
console.log('=================================');
process.exit(fallas > 0 ? 1 : 0);
