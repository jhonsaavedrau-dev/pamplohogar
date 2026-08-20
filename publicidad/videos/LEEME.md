# Videos de publicidad

Los videos se escriben con código (Remotion) en vez de armarse en un editor.
Suena raro, pero tiene una razón: **cambiar un texto y volver a generar el
video es un comando**, y el mismo video se puede rehacer con los datos reales
de la plataforma.

---

## La licencia, por si alguien pregunta

Remotion es gratis para una persona sola, incluso para uso comercial. Se paga
solo cuando el equipo llega a 4 personas o cuando se le entrega el código a un
cliente para que él lo maneje.

---

## Cómo generar un video

Desde esta carpeta:

```
npm run historia
```

Sale en `videos/historia-sin-conocidos.mp4`, listo para subir a un estado de
WhatsApp o a una historia de Instagram.

**Toma unos 20 segundos.** La primera vez se demora más porque descarga el
navegador que hace el trabajo.

---

## Cómo ver los cambios sin renderizar

```
npm run ver
```

Abre una ventana donde se ve el video y se puede mover el tiempo con el ratón,
como un editor. Sirve para ajustar sin esperar el render de cada prueba.

---

## Cómo revisar un momento suelto

Renderizar 450 cuadros para ver si un texto cabe es perder el tiempo. Para
sacar una sola foto de un momento:

```
npx remotion still HistoriaSinConocidos videos/prueba.png --frame=150
```

El cuadro 150 son los 5 segundos, porque van 30 cuadros por segundo.

---

## Qué hay dentro

```
src/
├── marca.ts                  Los colores y las medidas
├── HistoriaSinConocidos.tsx  El video: qué aparece y cuándo
├── Root.tsx                  El catálogo de videos
└── index.ts                  El arranque
public/                       El logo y el código QR
```

Para cambiar un texto se toca `HistoriaSinConocidos.tsx` y ya. Arriba del
archivo está el guion escrito por segundos.

---

## Lo que no se guarda en GitHub

Ni `node_modules` ni los `.mp4`. Se guarda la receta, que pesa unos kilobytes,
y el video se vuelve a generar cuando haga falta. Un mp4 cambia entero en cada
render y llenaría el repositorio de archivos pesados.

---

## Lo siguiente, si esto sirve

Un video que se arme solo con las publicaciones de la semana: se le pasan los
inmuebles nuevos y saca un video con sus fotos, precios y barrios. Eso es lo
que un editor normal no puede hacer, y es la única razón de peso para usar
esto en vez de CapCut.

---

## El video de un minuto

```
npm run video
```

Sale en `videos/pamplohogar.mp4`. Tarda unos cinco minutos.

Está armado con capturas reales del sitio, metidas en marcos de celular y de
computador dibujados con código. Sin grabar nada.

**58,6 segundos, en cinco tramos:**

| Tiempo | Qué pasa |
|---|---|
| 0 – 8,7 s | El problema, en tres frases |
| 8,7 – 11,7 s | El giro: *¿y si no tuvieras que preguntarle a nadie?* |
| 11,7 – 13,9 s | El sello: el logo, animado |
| 13,9 – 53,5 s | Tres capítulos, diez pantallas |
| 53,5 – 58,6 s | El cierre con el código QR |

### Los tres capítulos

Diez funciones seguidas se leen como una lista; separadas en **Para buscar**,
**Para decidir** y **Para dar el paso** se leen como un camino, que es lo que
de verdad son.

### Para cambiarlo

Todo lo que se cambia está en dos listas al principio de
`src/VideoCompleto.tsx`:

- **PROBLEMA**: las tres frases del comienzo.
- **CAPITULOS**: los tres bloques y sus pantallas — qué captura sale, en qué
  aparato, con qué texto y con qué movimiento.

El video entero dice una sola cosa: hoy buscar arriendo en Pamplona es
**preguntar**, y esto es no tener que preguntarle a nadie. Si se cambia un
texto, que siga respondiendo a eso.

### El naranja se reserva

Solo tres palabras en todo el video van en naranja — **preguntar**,
**esperar**, **nadie** — más la etiqueta del capítulo. Se marcan con
asteriscos:

```
'Buscar arriendo en Pamplona es *preguntar.*'
```

**El punto y la coma van DENTRO de los asteriscos.** Si quedan fuera, el
programa los trata como una palabra suelta y aparecen separados, con un espacio
en medio.

Antes se resaltaba una palabra en cada rótulo y terminaba marcando cosas que no
lo merecían. Si todo está resaltado, nada lo está.

### Los movimientos

| Movimiento | Qué hace |
|---|---|
| `bajar` | Recorre la página hacia abajo, de `desde` a `hasta` |
| `subir` | Lo mismo al revés |
| `quieto` | Se queda en `desde` |
| `acercar` | Quieto, pero acercándose un 8% |

`desde` y `hasta` son fracciones del alto de la **página completa**, no de la
pantalla: 0,3 es "un tercio de la página hacia abajo".

### Por qué las capturas son de página completa

Es lo que hace que no se vean borrosas. La imagen mide varias pantallas de
alto, así que moverla es un desplazamiento de verdad, con cada píxel en su
sitio. Antes se agrandaba una captura corta para simular movimiento, y agrandar
una imagen es inventarse píxeles.

### Por qué las escenas de computador van ampliadas

El portátil cabe entero en el video, pero entero no se lee: la letra queda del
tamaño de un grano de arroz en un celular. Por eso llevan `ampliar` entre 1,25
y 1,6, y `centroX` para decidir qué parte queda al centro.

Ampliar aquí no emborrona: la captura se toma al doble de resolución (2560 de
ancho para una ventana de 1280), así que hasta 1,6 sigue estando por debajo de
su tamaño real. **Por encima de 2 ya se nota.**

### Para actualizar las capturas

Cuando la plataforma cambie:

```
cd .. && npm run capturas
cp -r ../capturas public/
npm run video
```

El capturador hace tres cosas que no son obvias y sin las cuales las capturas
salen mal:

1. **Recorre la página entera antes de fotografiarla.** La plataforma hace
   aparecer las tarjetas cuando entran en pantalla, así que lo que nunca se vio
   sale invisible.
2. **Esconde lo que va fijo a la pantalla.** Si no, la barra de navegación de
   abajo sale estampada en mitad de la imagen.
3. **Le siembra tres inmuebles al comparador y le da clic al botón de
   filtros.** Esas dos pantallas no existen si se entra en frío.

Ojo: si cambia el diseño de una página, los `desde` y `hasta` de esa escena
quedan apuntando a otro sitio. Se revisan con `npx remotion still` antes de
renderizar los 1758 cuadros.

### Lo que falta y no puedo hacer yo

**La música.** El video sale mudo. Ponerle una canción y decidir dónde entra
y dónde calla es cuestión de oído: eso se hace en CapCut en diez minutos,
abriendo el mp4 y agregando el audio.
