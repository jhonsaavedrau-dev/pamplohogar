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
- [ ] **Panel de administrador.** El rol `ADMIN` ya existe en la base de datos pero hoy solo se usa
      para moderar a mano. Falta la pantalla para revisar y retirar publicaciones sospechosas.
- [ ] **Reportar una publicacion.** Un boton para que el estudiante avise de un anuncio falso o de
      un cobro abusivo.
- [ ] **Editar el orden de las fotos** arrastrandolas, y elegir cual es la portada.
- [ ] **Borrar de Cloudinary las fotos que se quitan.** Hoy se quitan del inmueble pero el archivo
      sigue ocupando espacio en la cuenta.

## Mediano plazo

- [ ] **Chat interno en tiempo real** entre estudiante y arrendador, para no depender de WhatsApp.
- [ ] **Notificaciones** por correo cuando aparece un inmueble que encaja con lo que el estudiante
      busca.
- [ ] **Comparador** de hasta tres inmuebles lado a lado.
- [ ] **Buscador de roomies** para estudiantes que quieren compartir arriendo y repartir gastos.
- [ ] **Historial de precios** de cada inmueble, para hacer visible cuando alguien sube el precio de
      un semestre a otro.
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
