# Roadmap de PamploHogar

Lo que quedo fuera de la primera version, con el motivo. Nada de esto hace falta para que la
plataforma sirva hoy: se aplazo a proposito para tener algo real y publicado antes que algo
completo y guardado en un computador.

## Siguiente paso inmediato

- [x] ~~**Publicar en internet.**~~ Hecho el 11 de agosto de 2026. La pagina vive en
      pamplohogar.vercel.app y el servidor en pamplohogar-api.onrender.com. Cada cambio subido a
      GitHub se despliega solo.

## Corto plazo

- [x] ~~**Verificacion de correo al registrarse.**~~ Hecho: al registrarse llega un correo de
      confirmacion y queda un aviso en la pagina hasta confirmarlo. Todavia no se exige para
      publicar, solo se muestra como senal de confianza.
- [x] ~~**Recuperar contrasena.**~~ Hecho: enlace de un solo uso que vence en una hora. La respuesta
      es igual exista o no la cuenta, para no delatar quien esta registrado, y en la base solo se
      guarda el hash del enlace.
- [x] ~~**Panel de administrador.**~~ Hecho el 11 de agosto de 2026: resumen de la plataforma,
      moderacion de inmuebles, gestion de cuentas y retiro de resenas. Marca solo los precios
      alejados de la mediana de la ciudad y los inmuebles sin fotos.
- [x] ~~**Reportar una publicacion.**~~ Hecho: el estudiante avisa desde el detalle eligiendo un
      motivo, y le llega al administrador a una cola con contador. Queda registrado quien atendio
      cada reporte y con que nota.
- [x] ~~**Borrar de Cloudinary las fotos que se quitan.**~~ Hecho: al editar o eliminar un inmueble
      se borran tambien de Cloudinary las fotos que ya no se usan.
- [x] ~~**Registro de lo que hace cada administrador.**~~ Hecho: pestana Registro en el panel con
      quien hizo que y cuando. Guarda el titulo o el correo en texto y no solo el id, para que el
      rastro sobreviva al borrado.
- [ ] **Exigir el correo confirmado para publicar.** Hoy se muestra el aviso pero no se obliga.
      Conviene hacerlo cuando haya arrendadores de verdad.
- [x] ~~**Separar la base de datos de pruebas de la de produccion.**~~ Hecho: el computador usa
      `pamplohogar_dev` y internet sigue con `neondb`, las dos dentro del mismo proyecto de Neon.
      Hay una prueba (`prueba-aislamiento.mjs`) que borra un inmueble en pruebas y comprueba que en
      internet no cambia nada.
- [x] ~~**Editar el orden de las fotos** y elegir cual es la portada.~~ Hecho con botones de subir,
      bajar y hacer portada, en vez de arrastrar: arrastrar es incomodo en celular y la plataforma
      se usa sobre todo desde el telefono.

- [ ] **Limitar los intentos por cuenta y no solo por conexion.** Hoy solo se cuentan los intentos
      fallidos, asi que un salon entero entrando desde el wifi de la universidad no se bloquea
      entre si. Pero si alguien ataca desde esa misma red, los demas quedan frenados quince
      minutos. Contar los fallos por correo, ademas de por conexion, quita ese efecto colateral.
- [x] ~~**Tildes y enes en toda la interfaz.**~~ Hecho: 49 archivos repasados con una regla que
      solo toca frases, nunca rutas ni nombres de variables.

## Mediano plazo

- [ ] **Chat interno en tiempo real** entre estudiante y arrendador, para no depender de WhatsApp.
- [x] ~~**Notificaciones** por correo cuando aparece un inmueble que encaja.~~ Hecho: el estudiante
      guarda su busqueda desde el buscador y una tarea diaria le avisa. Solo cuentan los inmuebles
      publicados despues de guardar, y nunca los suyos propios.
- [x] ~~**Comparador** de hasta tres inmuebles lado a lado.~~ Hecho: se marcan desde el listado y se
      ven en una tabla que resalta el mas barato, el mas cercano y el mejor calificado. La seleccion
      vive en el navegador, no en la cuenta.
- [x] ~~**Buscador de roomies.**~~ Hecho: perfil con presupuesto, zona, carrera y como es cada
      quien para convivir. El celular sale solo al pulsar escribirle y queda constancia, igual que
      con los inmuebles.
- [x] ~~**Historial de precios**~~ Hecho: cada cambio de precio queda registrado y el estudiante ve
      en el detalle cuanto subio o bajo desde que se publico, con la fecha de cada cambio.
- [ ] **Ficha en PDF** del inmueble, para compartirla por fuera de la plataforma.
- [ ] **Resenas del barrio**, no solo del arrendador: ruido, seguridad, transporte.

## Largo plazo

- [ ] **Mapa de calor de precios** por zona de la ciudad.
- [ ] **Aplicacion instalable que funcione sin internet** para consultar lo ya visto.
- [ ] **Autenticacion en dos pasos** para las cuentas de arrendador.

## Decisiones tecnicas aplazadas

Estas no aportan nada al usuario hoy y solo agregarian complejidad. Se retoman si el trafico lo
justifica:

- Docker y orquestacion de contenedores.
- Redis para cache y colas de trabajos en segundo plano.
- Motor de busqueda dedicado (Elasticsearch, Typesense). Hoy basta con SQL e `ILIKE`.
- PostGIS. Hoy la distancia se calcula con Haversine y es suficiente.
- Monitoreo con Datadog u otra herramienta de pago.
- Pruebas de extremo a extremo con Cypress. Hoy hay pruebas unitarias sobre la logica critica y
  se verifico cada flujo a mano.
- Infraestructura como codigo (Terraform) y microservicios.
