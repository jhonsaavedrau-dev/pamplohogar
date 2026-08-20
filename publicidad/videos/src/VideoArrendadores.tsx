import { AbsoluteFill, Sequence } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre, Frase, Marca } from './Piezas';
import { COLOR, VIDEO } from './marca';

/*
  "Tiene una habitacion desocupada?": 20 segundos, para ARRENDADORES.

  LE HABLA A LA OTRA MITAD. Todo lo demas que hay hecho -- el video largo, el
  de precios, las encuestas, los volantes -- le habla al estudiante. Y una
  plataforma de arriendos sin arriendos publicados no le sirve a ningun
  estudiante por bonita que sea. Quien decide si esto funciona no es el que
  busca: es la senora que tiene una habitacion desocupada y hoy la ofrece
  preguntandole al vecino.

  NO LE MUESTRA EL FORMULARIO DE PUBLICAR, y es a proposito. A nadie lo
  convence un formulario; a un arrendador lo convence ver COMO QUEDA lo suyo y
  quien lo va a ver. Por eso las tres pantallas son las que ve el estudiante,
  no las que llenaria el.

  EL TRATO ES LO QUE VENDE. La objecion de un arrendador de Pamplona no es el
  precio de publicar, es "quien se mete en el medio". La tercera pantalla
  responde justo eso: le escriben a usted, directo.

  Va en usted y no en tu. El video largo tutea porque le habla a un estudiante
  de dieciocho; este no.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_FRASE = s(3.2);
const DURACION_CIERRE = s(2.5);

const PROBLEMA = [
  '¿Tiene una habitación *desocupada*?',
  'Hay estudiantes buscando en Pamplona ahora mismo.',
];

/*
  Las tres pantallas van en el orden en que un arrendador se hace las
  preguntas: donde aparece lo mio, como se ve cuando lo abren, y quien me
  escribe.
*/
const ESCENAS: (DatosEscena & { duracion: number })[] = [
  {
    duracion: s(3.8),
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: ['Así la ven ellos:', 'con precio y con barrio'],
    movimiento: 'bajar',
    desde: 0.04,
    hasta: 0.24,
  },
  {
    duracion: s(3.8),
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: ['Con fotos, servicios', 'y los minutos hasta la U'],
    movimiento: 'bajar',
    desde: 0.02,
    hasta: 0.11,
    ampliar: 1.35,
    centroX: 0.42,
  },
  {
    duracion: s(3.5),
    captura: 'capturas/celular/3-ficha-larga.png',
    dispositivo: 'celular',
    // El recuadro de contacto quedo mas abajo que antes: al llenarse las
    // opiniones del barrio la ficha del celular crecio de 8244 a 10628 de alto
    // y todo lo que venia despues se corrio.
    rotulo: ['Y le escriben a usted,', 'sin intermediarios'],
    movimiento: 'bajar',
    desde: 0.62,
    hasta: 0.7,
  },
];

const COMIENZO_ESCENAS = DURACION_FRASE * PROBLEMA.length;
const DURACION_ESCENAS = ESCENAS.reduce((n, e) => n + e.duracion, 0);
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENAS;

export const DURACION_ARRENDADORES = COMIENZO_CIERRE + DURACION_CIERRE;

export function VideoArrendadores() {
  let reloj = COMIENZO_ESCENAS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      {PROBLEMA.map((texto, i) => (
        <Sequence key={texto} from={DURACION_FRASE * i} durationInFrames={DURACION_FRASE}>
          <Frase texto={texto} duracion={DURACION_FRASE} tamano={80} />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_ESCENAS} durationInFrames={DURACION_ESCENAS}>
        <Marca />
      </Sequence>

      {ESCENAS.map((escena, i) => {
        const desde = reloj;
        reloj += escena.duracion;
        return (
          <Sequence key={escena.captura} from={desde} durationInFrames={escena.duracion + 15}>
            <Escena {...escena} lado={i % 2 === 0 ? 1 : -1} capitulo="Para arrendadores" />
          </Sequence>
        );
      })}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Publique la suya hoy." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_ARRENDADORES} />
    </AbsoluteFill>
  );
}
