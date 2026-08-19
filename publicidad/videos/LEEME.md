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

## El video de 40 segundos

```
npm run video
```

Sale en `videos/pamplohogar-40s.mp4`. Tarda un minuto y medio.

Está armado con capturas reales del sitio, metidas en marcos de celular y de
computador dibujados con código. Sin grabar nada.

### Para cambiarlo

Todo lo que se cambia está en dos listas al principio de
`src/VideoCompleto.tsx`:

- **PROBLEMA**: las tres frases del comienzo.
- **ESCENAS**: qué captura sale, en qué dispositivo, con qué texto y con qué
  movimiento.

Los movimientos disponibles son cuatro, y cada uno imita algo que hace una
persona mirando una pantalla:

| Movimiento | Qué hace |
|---|---|
| `acercar` | Se inclina a mirar de cerca |
| `alejar` | Se echa para atrás y ve el conjunto |
| `recorrer` | Baja por la página |
| `deriva` | La mirada se pasea sin prisa |

En computador el movimiento va más fuerte a propósito: una captura de
computador entra en el marco a menos de la mitad de su tamaño, así que sin
acercarse no se lee nada.

### Para actualizar las capturas

Cuando la plataforma cambie:

```
node ../capturar-pantallas.mjs
cp -r ../capturas public/
npm run video
```

### Lo que falta y no puedo hacer yo

**La música.** El video sale mudo. Ponerle una canción y decidir dónde entra
y dónde calla es cuestión de oído: eso se hace en CapCut en diez minutos,
abriendo el mp4 y agregando el audio.
