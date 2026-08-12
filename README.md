# PamploHogar

Plataforma web que conecta a los estudiantes que llegan cada semestre a Pamplona, Norte de
Santander, con arrendadores que publican habitaciones, apartaestudios y apartamentos. La idea es
que nadie tenga que depender del voz a voz ni caer en cobros abusivos para encontrar donde vivir.

Todo esta pensado primero para el celular, porque es desde ahi que entra la mayoria de estudiantes.

## Que hace hoy

- **Dos tipos de cuenta.** El estudiante busca, filtra, guarda favoritos, contacta y resena. El
  arrendador publica y gestiona sus inmuebles.
- **Recuperar la contrasena** con un enlace de un solo uso que vence en una hora, y **confirmar el
  correo** al registrarse.
- **Publicacion de inmuebles** con hasta diez fotos, ubicacion marcada en el mapa y lista de
  servicios incluidos.
- **Busqueda con filtros** por texto, tipo, precio, barrio, numero de habitaciones, servicios y si
  esta amoblado. Se puede ordenar por precio, por fecha o por cercania a la Universidad de Pamplona.
- **Detalle del inmueble** con carrusel de fotos, mapa y la distancia real hasta la universidad.
- **Contacto protegido.** El celular del arrendador esta oculto hasta que el estudiante pulsa
  "Contactar". Ahi se genera un enlace de WhatsApp con el mensaje ya escrito y la solicitud queda
  registrada para que el arrendador sepa quien le escribio.
- **Chat dentro de la pagina.** El estudiante escribe al arrendador sin dar su numero, y queda por
  escrito lo que acordaron. Un hilo por publicacion, para que un arrendador con seis habitaciones
  sepa por cual le estan preguntando. Nadie mas puede leerlos, ni el administrador.
- **Ficha en PDF** de cada inmueble, para mostrarsela a los papas o mandarla por fuera de la
  plataforma. Incluye la comparacion con lo normal del barrio, y a proposito no incluye el celular
  del arrendador.
- **Se instala en el celular y sirve sin senal.** Se agrega a la pantalla de inicio como una
  aplicacion, y lo que ya se abrio se puede volver a mirar sin conexion, con un aviso arriba para
  que se entienda que son datos de antes. Publicar y enviar mensajes siempre exigen conexion.
- **Favoritos** para guardar lo que interesa y revisarlo despues.
- **Comparador** de hasta tres inmuebles lado a lado, resaltando cual es el mas barato, el mas
  cercano a la universidad y el de mejor arrendador.
- **Busquedas guardadas con aviso por correo.** El estudiante guarda sus filtros y una tarea diaria
  le avisa cuando aparece algo que encaja.
- **Buscador de roomies** para quienes quieren compartir arriendo y repartir gastos.
- **Resenas** del estudiante sobre el arrendador, con promedio de estrellas visible en cada tarjeta.
- **Reportar una publicacion.** El estudiante avisa desde el detalle si le cobraron mas de lo
  publicado, si el inmueble no existe o si lo trataron mal. El arrendador nunca sabe quien reporto.
- **Mapa de precios de la ciudad.** Muestra en que zonas se cobra mas y en cuales menos, con un
  boton por tipo de inmueble. Un barrio solo se pinta como zona cuando tiene al menos tres
  publicaciones de ese tipo; con menos se ven las publicaciones sueltas como puntos.
- **Comparacion con lo normal del barrio.** El detalle le dice al estudiante cuanto se cobra
  normalmente por algo parecido en esa zona y si lo que esta viendo se sale de ahi. Se usa la
  mediana, no el promedio, y no se muestra nada si hay menos de cuatro publicaciones parecidas.
- **Como es vivir en el barrio.** Estudiantes que ya vivieron ahi califican tranquilidad, seguridad
  y transporte, y cuentan lo que solo se sabe viviendo la zona. El promedio no se muestra hasta que
  haya al menos tres opiniones, porque una sola mala racha no define un barrio.
- **Historial de precios.** Cada cambio de precio queda registrado, y el estudiante ve cuanto subio
  o bajo desde que se publico. Sirve para negociar con datos y no de memoria.
- **Panel de administracion** para ver como va la plataforma y moderar: atender los reportes,
  retirar o eliminar publicaciones, gestionar cuentas y quitar resenas abusivas, tanto de
  arrendadores como de barrios. Marca solo los
  inmuebles con precio muy lejano al tipico de la ciudad y los que no tienen fotos.

## Como esta organizado el proyecto

```
PAMPLONAHOGAR/
├── backend/              El servidor: atiende las peticiones y habla con la base de datos
│   ├── prisma/
│   │   ├── schema.prisma   Definicion de las tablas
│   │   ├── migrations/     Historial de cambios de la base de datos
│   │   └── seed.ts         Datos de ejemplo (10 inmuebles de Pamplona)
│   └── src/
│       ├── lib/            Piezas reutilizables: base de datos, tokens, distancias, errores
│       ├── middleware/      Revisiones que corren antes de cada peticion (sesion, permisos)
│       ├── routes/          Las direcciones de la API agrupadas por tema
│       ├── schemas/         Reglas de validacion de todo lo que envia el usuario
│       ├── app.ts           Armado del servidor
│       └── index.ts         Punto de arranque
│
├── frontend/             Lo que ve el usuario en el navegador
│   ├── public/marca.svg    El icono de la casa con llave
│   └── src/
│       ├── components/     Piezas visuales reutilizables (tarjetas, mapa, carrusel)
│       ├── lib/            Conexion con la API, sesion, formatos de pesos y fechas
│       ├── pages/          Una pantalla completa por archivo
│       ├── App.tsx         Que pantalla se muestra en cada direccion
│       └── index.css       Colores, tipografia y estilos base
│
├── render.yaml           Configuracion para publicar el servidor
└── ROADMAP.md            Lo que quedo pendiente para mas adelante
```

## Como levantarlo en tu computador

Necesitas **Node.js 20 o superior** y **Git**. Nada mas: la base de datos y las fotos viven en la
nube, no hay que instalar nada pesado.

### 1. Configurar las claves

Copia `backend/.env.example` a `backend/.env` y llena los valores:

| Variable                | Para que sirve                                          |
| ----------------------- | ------------------------------------------------------- |
| `DATABASE_URL`          | Direccion de la base de datos PostgreSQL (Neon)          |
| `JWT_SECRET`            | Cadena larga y aleatoria que firma las sesiones          |
| `PORT`                  | Puerto del servidor, por defecto 4000                    |
| `FRONTEND_URL`          | Direccion del frontend, para permitir sus peticiones     |
| `CLOUDINARY_CLOUD_NAME` | Nombre de tu espacio en Cloudinary                       |
| `CLOUDINARY_API_KEY`    | Llave publica de Cloudinary                              |
| `CLOUDINARY_API_SECRET` | Llave secreta de Cloudinary                              |

El archivo `.env` nunca se sube al repositorio: esta bloqueado desde el primer commit.

### 2. Encender el servidor

```bash
cd backend && npm install && npx prisma migrate deploy && npm run dev
```

Queda escuchando en `http://localhost:4000`. Para comprobar que esta vivo, abre
`http://localhost:4000/api/salud`.

### 3. Encender la pagina

En otra terminal:

```bash
cd frontend && npm install && npm run dev
```

Abre `http://localhost:5173`.

### 4. Cargar los datos de ejemplo

```bash
cd backend && npm run seed
```

Crea 21 inmuebles en barrios reales de Pamplona, 3 arrendadores, 5 estudiantes, 4 resenas de
arrendador y 9 opiniones sobre barrios. Estan agrupados como se agrupa de verdad la vivienda
estudiantil, cerca de la universidad y en el centro, para que el mapa de precios tenga zonas.
Todas las cuentas de ejemplo usan la contrasena `pamplona2026`:

- Arrendador: `marta.villamizar@ejemplo.com`
- Estudiante: `andres.rojas@ejemplo.com`

### 5. Crear un administrador

El registro de la pagina solo permite crear estudiantes y arrendadores. El rol de administrador se
otorga a proposito desde este computador, nunca desde la web:

```bash
cd backend && npm run hacer-admin -- tucorreo@ejemplo.com
```

La cuenta ya debe existir. Despues de correrlo hay que cerrar sesion y volver a entrar.

Asi, aunque alguien lograra entrar a una cuenta de administrador, no podria crear mas
administradores ni dejarte por fuera.

## Pruebas

```bash
cd backend && npm test
```

```bash
cd frontend && npm test
```

Son 68 pruebas sobre la logica que de verdad importa: el calculo de distancias, la firma y
verificacion de sesiones, las reglas de validacion de cada formulario, el armado del enlace de
WhatsApp, la referencia de precio del barrio la forma de agrupar barrios escritos distinto y el freno de intentos de entrada.

Con el servidor encendido se pueden correr ademas las pruebas de la plataforma completa:

```bash
cd backend && npm run test:api
```

```bash
cd backend && node pruebas/prueba-admin.mjs
```

La primera recorre los 32 flujos de estudiante y arrendador. La segunda verifica las 29 reglas del
panel de administracion, sobre todo que nadie sin ese rol pueda entrar. Ambas aceptan una direccion
como argumento para probar el servidor de internet en vez del local.

## Decisiones tecnicas

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query,
  React Hook Form, Zod y Leaflet sobre OpenStreetMap.
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, bcrypt, JSON Web Tokens,
  helmet, cors y limite de intentos en las rutas de sesion.
- **La busqueda es SQL normal** con filtros e `ILIKE`. No hace falta un motor de busqueda dedicado
  para el volumen de una ciudad como Pamplona.
- **La distancia a la universidad se calcula con la formula de Haversine** sobre las coordenadas,
  sin extensiones geograficas en la base de datos.
- **Se usa `bcryptjs`** en lugar de `bcrypt` porque no necesita compilarse y evita fallos de
  instalacion en Windows y en los servidores gratuitos. El algoritmo es el mismo.
- **Sin Docker.** Se conecta directo a la base de datos en la nube desde el primer momento.

## Seguridad

- Las contrasenas se guardan con bcrypt, nunca en texto plano ni en los registros del servidor.
- Todo lo que envia el usuario se valida con Zod antes de tocar la base de datos.
- Cada endpoint revisa que el usuario tenga permiso sobre ese recurso, no solo que haya iniciado
  sesion. Nadie puede editar ni borrar inmuebles ajenos.
- El celular del arrendador no viaja en las respuestas publicas.
- Las rutas de registro e inicio de sesion tienen limite de intentos, por conexion y ademas por
  cuenta. Diez fallos seguidos en una cuenta la frenan quince minutos sin afectar a nadie mas, y
  cambiar la contrasena por correo levanta el freno.
- Los errores muestran un mensaje claro en espanol y dejan el detalle tecnico solo en el servidor.
