const BASE = 'http://localhost:4000/api';

async function login(password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'andres.rojas@ejemplo.com', password }),
  });
  return r.status;
}

console.log('--- 40 inicios de sesion CORRECTOS seguidos (simula el wifi del campus) ---');
let bloqueadosBuenos = 0;
for (let i = 0; i < 40; i++) {
  const s = await login('pamplona2026');
  if (s === 429) bloqueadosBuenos++;
}
console.log(
  bloqueadosBuenos === 0
    ? 'OK    ninguno fue bloqueado, los estudiantes pueden entrar'
    : `FALLA ${bloqueadosBuenos} inicios correctos fueron bloqueados`,
);

console.log('\n--- ahora 30 intentos con contrasena EQUIVOCADA (simula un ataque) ---');
let primerBloqueo = -1;
for (let i = 0; i < 30; i++) {
  const s = await login('contrasena-equivocada');
  if (s === 429 && primerBloqueo === -1) primerBloqueo = i + 1;
}
console.log(
  primerBloqueo > 0
    ? `OK    el atacante quedo bloqueado en el intento numero ${primerBloqueo}`
    : 'FALLA nunca se bloqueo, el limitador no esta protegiendo',
);

console.log('\n--- y un estudiante legitimo despues del ataque ---');
const despues = await login('pamplona2026');
console.log(
  despues === 429
    ? 'NOTA  tambien quedo bloqueado temporalmente (efecto colateral esperado del limite por IP)'
    : `OK    puede entrar normal (estado ${despues})`,
);
