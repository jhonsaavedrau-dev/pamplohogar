# Como publicar PamploHogar en internet

Esta guia es para pasar de "funciona en mi computador" a "funciona desde el celular de cualquier
estudiante". Son tres partes y cada una necesita que crees una cuenta gratuita.

Todo lo tecnico ya esta preparado. Lo que falta es que tu autorices con tus cuentas, porque nadie
mas puede hacerlo por ti.

---

## Antes de empezar: que va a donde

PamploHogar son dos piezas que viven en sitios distintos:

| Pieza          | Que hace                                    | Donde va  |
| -------------- | ------------------------------------------- | --------- |
| **frontend**   | Lo que ve el estudiante en su pantalla       | Vercel    |
| **backend**    | Guarda y entrega los datos                   | Render    |
| **base de datos** | Donde de verdad viven los inmuebles       | Neon (ya esta) |
| **fotos**      | Las imagenes de cada inmueble                | Cloudinary (ya esta) |

La base de datos y las fotos ya quedaron configuradas. Faltan las dos primeras.

---

## PARTE 1: Subir el codigo a GitHub

GitHub es donde se guarda el codigo para que Render y Vercel puedan leerlo.

### 1.1 Crear la cuenta

1. Entra a **https://github.com/signup**
2. Registrate con tu correo `jhonsaavedrau@gmail.com`.
3. Elige un nombre de usuario (por ejemplo `jhonsaavedra`). Anotalo, lo vamos a usar.
4. Confirma el correo cuando te llegue el codigo.
5. Cuando te pregunte el plan, elige **Free**.

### 1.2 Conectar tu computador con GitHub

Abre la terminal y pega este comando:

```bash
gh auth login
```

Te va a hacer unas preguntas. Responde asi, moviendote con las flechas y confirmando con Enter:

- *What account do you want to log into?* → **GitHub.com**
- *What is your preferred protocol?* → **HTTPS**
- *Authenticate Git with your GitHub credentials?* → **Yes**
- *How would you like to authenticate?* → **Login with a web browser**

Te va a mostrar un codigo de ocho caracteres (algo como `AB12-CD34`). **Copialo**, presiona Enter y
se te abre el navegador. Pega el codigo ahi y autoriza.

Cuando termine, avisame y yo subo el codigo. O si quieres hacerlo tu, son estos dos comandos:

```bash
cd "C:\Users\jhons\OneDrive\Desktop\PAMPLONAHOGAR"
```

```bash
gh repo create pamplohogar --private --source=. --push
```

---

## PARTE 2: Publicar el servidor en Render

### 2.1 Crear la cuenta

1. Entra a **https://render.com**
2. Haz clic en **Get Started** y elige **GitHub** para registrarte.
3. Autoriza a Render a ver tus repositorios.

### 2.2 Crear el servicio

1. En el panel, haz clic en **New +** y elige **Web Service**.
2. Busca el repositorio **pamplohogar** y haz clic en **Connect**.
3. Render va a leer el archivo `render.yaml` y llenar casi todo solo. Verifica que diga:
   - **Name:** pamplohogar-api
   - **Root Directory:** backend
   - **Instance Type:** Free
4. Baja hasta **Environment Variables**. Ahi tienes que pegar seis valores. Son los mismos que
   estan en tu archivo `backend/.env`. Si no lo tienes a mano, pidemelos y te los paso:

   | Nombre                  | Valor                                             |
   | ----------------------- | ------------------------------------------------- |
   | `DATABASE_URL`          | La direccion de Neon                              |
   | `JWT_SECRET`            | La clave larga que genere                         |
   | `FRONTEND_URL`          | Dejalo en `https://pamplohogar.vercel.app` por ahora |
   | `CLOUDINARY_CLOUD_NAME` | `gdiurprn`                                        |
   | `CLOUDINARY_API_KEY`    | Tu llave de Cloudinary                            |
   | `CLOUDINARY_API_SECRET` | Tu secreto de Cloudinary                          |

5. Haz clic en **Create Web Service**.

Va a tardar entre cinco y diez minutos la primera vez. Cuando termine, arriba vas a ver una
direccion parecida a `https://pamplohogar-api.onrender.com`. **Copiala.**

Para comprobar que quedo bien, abre esa direccion agregandole `/api/salud` al final. Debe decir
`{"estado":"ok","baseDeDatos":"conectada"}`.

> **Ojo con el plan gratuito de Render:** si nadie usa la pagina por quince minutos, el servidor se
> "duerme" y la primera visita despues puede tardar hasta un minuto en cargar. Las siguientes van
> normales. Es el precio de no pagar nada y para empezar sirve perfecto.

---

## PARTE 3: Publicar la pagina en Vercel

### 3.1 Crear la cuenta

1. Entra a **https://vercel.com/signup**
2. Elige **Continue with GitHub** y autoriza.

### 3.2 Crear el proyecto

1. Haz clic en **Add New...** y elige **Project**.
2. Busca **pamplohogar** y haz clic en **Import**.
3. **Este paso es importante:** donde dice **Root Directory**, haz clic en **Edit** y elige la
   carpeta **frontend**.
4. Abre **Environment Variables** y agrega una sola:
   - **Name:** `VITE_API_URL`
   - **Value:** la direccion de Render que copiaste, sin barra al final.
     Ejemplo: `https://pamplohogar-api.onrender.com`
5. Haz clic en **Deploy**.

En dos o tres minutos te da una direccion como `https://pamplohogar.vercel.app`. **Esa es la URL
que le vas a mandar a los estudiantes por WhatsApp.**

---

## PARTE 4: Presentar las dos piezas (no te saltes esto)

Ahora mismo el servidor todavia no confia en la pagina. Hay que decirselo:

1. Vuelve a **Render**, entra a tu servicio **pamplohogar-api**.
2. Ve a **Environment** en el menu de la izquierda.
3. Busca `FRONTEND_URL` y cambia su valor por la direccion exacta que te dio Vercel.
4. Guarda. Render se reinicia solo en un par de minutos.

Si te saltas este paso, la pagina abre pero no carga ningun inmueble.

---

## PARTE 5: Comprobar que quedo bien

Abre la direccion de Vercel **desde tu celular y con datos moviles** (no con wifi, para probar de
verdad como lo va a ver un estudiante). Revisa esta lista:

- [ ] Cargan los diez inmuebles con sus fotos.
- [ ] Los filtros de precio y tipo cambian los resultados.
- [ ] Abres un inmueble y se ve el carrusel y el mapa.
- [ ] Puedes crear una cuenta nueva.
- [ ] Al pulsar "Contactar" aparece el numero y el boton de WhatsApp.
- [ ] Puedes guardar un favorito y sigue ahi al recargar.

Si algo falla, mandame lo que ves en pantalla y lo arreglamos.

---

## Notas

### Hay DOS bases de datos, no una

Esta guia decia que era una sola. Ya no lo es, y conviene saberlo antes de que
sorprenda:

- La de **tu computador** es la que dice `backend/.env`. Ahi se prueba sin miedo.
- La de **internet** es la que dice `DATABASE_URL` en el panel de Render. Es la
  que ve la gente.

Estan separadas a proposito. Una vez las pruebas dejaron cuentas falsas en la
base de internet justamente porque eran la misma, y separarlas es lo que impide
que vuelva a pasar.

**Como saber en cual estas parado:** si el numero de inmuebles no cuadra, son
distintas.

```
curl "https://api.pamplohogar.com/api/inmuebles?pagina=1"
```

El campo `total` de esa respuesta es lo que hay en internet.

### Cargar los datos de ejemplo en la base de internet

Los ejemplos (los inmuebles, las opiniones de barrio, las resenas) viven en
`backend/prisma/seed.ts`. Cargarlos en tu computador es `npm run seed`. Para
cargarlos en internet hacen falta dos pasos, y van separados a proposito: asi
nunca se toca la base de la gente sin querer.

**1.** En el panel de Render, entra al servicio `pamplohogar-api`, abre
**Environment** y copia el valor de `DATABASE_URL`. Crea el archivo
`backend/.env.produccion` con esa direccion, en una sola linea:

```
DATABASE_URL=lo que copiaste de Render
```

Las comillas no hacen falta, y `DIRECT_URL` tampoco: solo la usan las
migraciones, y si no esta escrita el comando reutiliza la misma direccion.

Ese archivo NO se sube a GitHub, ya esta en la lista de ignorados. Y borralo
cuando termines.

**2.** Desde `backend/`:

```
npm run seed:produccion
```

El comando revisa el archivo antes de conectarse a nada. Si todavia dice
`PEGA-AQUI`, si lo que hay no parece una direccion de base de datos, o si por
equivocacion quedo pegada la direccion de la base de pruebas, se detiene y lo
dice en una linea en vez de soltar el error de la libreria, que no se entiende.

**Que borra y que no.** Borra y vuelve a crear unicamente las cuentas de
ejemplo, las que terminan en `@ejemplo.com`, y las de prueba, que terminan en
`@test.com` — con sus publicaciones y sus resenas. **No toca ninguna cuenta ni
ninguna publicacion de una persona de verdad.** Se puede correr las veces que
haga falta.

**Cuando corras esto, la publicidad cambia.** El video de `publicidad/` se arma
con capturas del sitio publicado, asi que despues de cargar los ejemplos hay que
volver a tomarlas y volver a renderizar. Esta explicado en
`publicidad/videos/LEEME.md`.

**Cada vez que cambiemos el codigo**, basta con subirlo a GitHub y tanto Render como Vercel se
actualizan solos. No hay que repetir nada de esta guia.

**Las cuentas de ejemplo** (`marta.villamizar@ejemplo.com` y las demas, contrasena `pamplona2026`)
sirven para mostrarle la plataforma a alguien. Cuando empieces a tener arrendadores de verdad,
conviene borrarlas.
