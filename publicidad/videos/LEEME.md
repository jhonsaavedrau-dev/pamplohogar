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
