# Cómo crear las encuestas en Google Forms sin armarlas a mano

Aquí hay dos programas que **construyen el formulario solo**, con todas sus
preguntas y opciones. Copiar y pegar 30 preguntas a mano toma una hora y es
donde se cuelan los errores; esto toma dos minutos.

---

## Pasos

1. Entra a **script.google.com** con tu cuenta de Google.
2. **Nuevo proyecto**.
3. Borra todo lo que aparezca en el editor.
4. Abre `crear-encuesta-estudiantes.gs` (aquí al lado), copia **todo** el
   contenido y pégalo.
5. Arriba, donde dice *Sin título*, ponle un nombre: `Encuesta PamploHogar`.
6. Dale a **Guardar** (el disquete).
7. Dale a **Ejecutar** (el botón de play).
8. La primera vez pide permisos: **Revisar permisos → tu cuenta → Configuración
   avanzada → Ir a (nombre del proyecto) → Permitir**.

   *Google avisa que la app "no está verificada". Es normal: la app eres tú
   mismo. Estás autorizando tu propio programa a crear un formulario en tu
   propia cuenta.*

9. Cuando termine, abre el **Registro de ejecución** (abajo). Ahí sale el
   enlace del formulario recién creado, listo para compartir.

Repite lo mismo con `crear-encuesta-arrendadores.gs` en un proyecto nuevo.

---

## Qué queda hecho

- El formulario con todas las preguntas, en orden y con sus opciones.
- Las preguntas obligatorias marcadas como obligatorias.
- La presentación de arriba explicando de qué se trata.
- Las respuestas se guardan solas en una hoja de cálculo.

---

## Después de crearlo

- **Pruébalo tú primero.** Respóndelo completo una vez y revisa que la hoja de
  cálculo reciba bien los datos. Después borra esa respuesta de prueba.
- **Acorta el enlace.** El que da Google es larguísimo y no cabe en un cartel.
  Con acortarlo en cualquier servicio gratuito basta.
- **Un enlace por canal.** Si duplicas el formulario y usas uno para WhatsApp y
  otro para la universidad, sabes qué canal rindió. También sirve agregar una
  pregunta "¿por dónde llegaste?".

---

## Si algo falla

- **"No tienes permiso"**: no completaste el paso 8. Ejecuta otra vez.
- **"Se agotó el tiempo"**: vuelve a ejecutar, a veces Google se demora.
- **Se crearon dos formularios**: le diste a Ejecutar dos veces. Borra el
  repetido desde tu Google Drive.
