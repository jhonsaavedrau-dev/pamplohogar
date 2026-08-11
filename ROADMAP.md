# Roadmap de PamploHogar

Lo que quedo fuera de la primera version, con el motivo. Nada de esto hace falta para que la
plataforma sirva hoy: se aplazo a proposito para tener algo real y publicado antes que algo
completo y guardado en un computador.

## Siguiente paso inmediato

- [ ] **Publicar en internet.** Subir el repositorio a GitHub, desplegar el servidor en Render y la
      pagina en Vercel, y correr las migraciones en produccion. Los archivos de configuracion
      (`render.yaml` y `frontend/vercel.json`) ya estan listos.

## Corto plazo

- [ ] **Verificacion de correo al registrarse.** Hoy el registro entra directo. Conviene confirmar
      el correo antes de dejar publicar, sobre todo para los arrendadores.
- [ ] **Recuperar contrasena.** Hoy no hay forma de recuperarla si se olvida.
- [x] ~~**Panel de administrador.**~~ Hecho el 11 de agosto de 2026: resumen de la plataforma,
      moderacion de inmuebles, gestion de cuentas y retiro de resenas. Marca solo los precios
      alejados de la mediana de la ciudad y los inmuebles sin fotos.
- [x] ~~**Reportar una publicacion.**~~ Hecho: el estudiante avisa desde el detalle eligiendo un
      motivo, y le llega al administrador a una cola con contador. Queda registrado quien atendio
      cada reporte y con que nota.
- [x] ~~**Borrar de Cloudinary las fotos que se quitan.**~~ Hecho: al editar o eliminar un inmueble
      se borran tambien de Cloudinary las fotos que ya no se usan.
- [ ] **Registro de lo que hace cada administrador.** Los reportes ya guardan quien los atendio,
      pero eliminar un inmueble o una cuenta todavia no deja rastro. Con un solo administrador no
      importa; con varios, si.
- [ ] **Separar la base de datos de pruebas de la de produccion.** Hoy el computador y el sitio en
      internet usan la misma. Mientras los datos son de ejemplo no pasa nada, pero con arrendadores
      reales publicando es peligroso probar en local.
- [ ] **Editar el orden de las fotos** arrastrandolas, y elegir cual es la portada.
- [ ] **Borrar de Cloudinary las fotos que se quitan.** Hoy se quitan del inmueble pero el archivo
      sigue ocupando espacio en la cuenta.
- [ ] **Limitar los intentos por cuenta y no solo por conexion.** Hoy solo se cuentan los intentos
      fallidos, asi que un salon entero entrando desde el wifi de la universidad no se bloquea
      entre si. Pero si alguien ataca desde esa misma red, los demas quedan frenados quince
      minutos. Contar los fallos por correo, ademas de por conexion, quita ese efecto colateral.

## Mediano plazo

- [ ] **Chat interno en tiempo real** entre estudiante y arrendador, para no depender de WhatsApp.
- [ ] **Notificaciones** por correo cuando aparece un inmueble que encaja con lo que el estudiante
      busca.
- [ ] **Comparador** de hasta tres inmuebles lado a lado.
- [ ] **Buscador de roomies** para estudiantes que quieren compartir arriendo y repartir gastos.
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
