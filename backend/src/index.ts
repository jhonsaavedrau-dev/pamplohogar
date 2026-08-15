import { crearApp } from './app.js';
import { env } from './lib/env.js';

const app = crearApp();

const servidor = app.listen(env.PORT, () => {
  process.stdout.write(`PamploHogar API escuchando en http://localhost:${env.PORT}\n`);
});

/*
  Que el servidor no cuelgue el telefono cuando hay mucha gente adentro.

  Node cierra por su cuenta las conexiones que llevan cinco segundos quietas.
  Con la plataforma llena, el navegador reutiliza una conexion justo cuando el
  servidor la esta cerrando: la peticion se pierde sin llegar y al estudiante
  le sale un error de esos que no explican nada.

  La prueba de carga lo reprodujo: con 250 peticiones a la vez se caian 21 de
  4.550, siempre al crear cuenta o al entrar, que son las dos que se demoran
  porque tienen que cifrar la contrasena. Subiendo esta espera a 72 segundos
  se cayeron cero.

  El limite de cabeceras tiene que quedar por encima del otro, si no se corta
  igual, solo que un paso mas adelante.
*/
servidor.keepAliveTimeout = 72_000;
servidor.headersTimeout = 75_000;
