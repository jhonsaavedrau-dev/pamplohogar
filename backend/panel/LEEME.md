# El panel de control

Una página que dice, en cristiano, cómo va PamploHogar: cuánta gente se ha
registrado, cuántos inmuebles hay publicados, cuántos mensajes se han escrito y
qué pasó en los últimos días.

---

## Cómo se abre

Doble clic en **`PANEL.bat`**, que está en la carpeta de `pamplohogar`.

Se abre una ventana negra —ese es el motor, no la cierres— y el navegador entra
solo a `http://localhost:4321`.

Para apagarlo, cierra la ventana negra.

---

## Qué muestra

| Bloque | Qué dice |
|---|---|
| **La gente** | Cuentas creadas, cuántas esta semana, y cuántos son estudiantes y cuántos arrendadores |
| **Registros de 30 días** | Una barra por día. De un vistazo se ve si está creciendo o si se quedó quieto |
| **Las publicaciones** | Inmuebles a la vista, publicados esta semana, favoritos, opiniones |
| **Las conversaciones** | Conversaciones abiertas y mensajes escritos |
| **Quién se registró último** | Los últimos doce, con si confirmaron el correo |
| **Lo último publicado** | Los últimos doce inmuebles, con precio y si están a la vista |
| **En qué barrios hay algo** | El conteo por barrio |

Se refresca solo cada minuto.

**Las cuentas de ejemplo no cuentan como gente.** Todo lo que termina en
`@ejemplo.com` o `@test.com` queda fuera de los números de personas: si no, el
panel diría que hay once usuarios el día que en realidad no hay ninguno.

---

## De qué base lee

Mira primero `backend/.env.produccion`. Si ese archivo existe y tiene la
dirección, lee **la plataforma de internet**, y lo dice arriba en verde.

Si no existe, lee la base de pruebas de tu computador, y lo avisa en naranja
para que no confundas un número con otro.

Para ver la de internet, crea `backend/.env.produccion` con una sola línea:

```
DATABASE_URL=<lo que sale en Render, en pamplohogar-api, pestaña Environment>
```

---

## Para cambiar datos

El panel **solo mira**. No borra, no corrige, no toca nada — a propósito: una
pantalla que refresca sola cada minuto no es sitio para tener un botón de
borrar.

Para cambiar cosas, doble clic en **`DATOS.bat`**. Abre el editor de la base:
todas las tablas, con el ratón, fila por fila. Ahí se borra una publicación, se
corrige un correo o se quita una reseña.

**Con cuidado**: eso escribe directamente en la base y no pregunta dos veces.

---

## Por qué está fuera de la plataforma

La plataforma ya tiene una pantalla de administración, pero esa la sirve
internet y hay que entrar con usuario y clave.

Este panel corre en tu computador y en ningún otro sitio. Escucha solo en
`127.0.0.1`, que quiere decir que la página existe únicamente para la máquina
donde corre: ni alguien en tu wifi ni nadie en internet puede abrirla, aunque
supiera el número del puerto.
