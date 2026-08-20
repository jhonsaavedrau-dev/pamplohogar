import { AbsoluteFill, Sequence } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre, Frase, Marca } from './Piezas';
import { COLOR, VIDEO } from './marca';

/*
  "Eso es caro?": 15 segundos, para historias y estados.

  OTRO ENFOQUE, NO UN RESUMEN DEL LARGO. El video de un minuto cuenta que
  buscar arriendo en Pamplona es preguntar. Este habla de PLATA, que es lo que
  de verdad le duele a un estudiante, y se mete por una pregunta que casi todo
  el que arrienda en Pamplona se ha hecho callado: me estaran cobrando de mas.

  UNA SOLA FUNCION. Quince segundos no dan para una lista, y una lista en
  quince segundos no se recuerda: se recuerda una cosa. Aqui es la comparacion
  de precios, que ademas es lo unico que no tiene nadie mas en la ciudad.

  POR QUE 15 Y NO 20. Es lo que dura una historia de Instagram sin partirse en
  dos, y lo que aguanta un estado de WhatsApp. Un video que se corta a la mitad
  no se ve completo aunque el que mira quiera.

  SIN CODIGO QR AL FINAL. En quince segundos nadie saca el otro telefono a
  escanear. Alcanza para leer una direccion, y el codigo solo le quitaria
  tamano al nombre.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_FRASE = s(3);
const DURACION_CIERRE = s(2);

const PROBLEMA = [
  'Te piden *$450.000* por una habitación.',
  '¿Eso es caro, o es lo normal?',
];

/*
  Dos pantallas y se acaba: la que responde por ese arriendo, y la que responde
  por toda la ciudad. En ese orden, porque primero se contesta la pregunta que
  uno hizo y despues se enseña que la respuesta no era casualidad.
*/
const ESCENAS: (DatosEscena & { duracion: number })[] = [
  {
    duracion: s(3.8),
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: ['Aquí te dice con qué', 'se está comparando'],
    movimiento: 'bajar',
    desde: 0.296,
    hasta: 0.341,
    ampliar: 1.6,
    centroX: 0.37,
  },
  {
    duracion: s(3.2),
    captura: 'capturas/computador/5-mapa-precios.png',
    dispositivo: 'computador',
    rotulo: ['Y cuánto se cobra', 'en cada barrio'],
    movimiento: 'acercar',
    desde: 0.11,
    ampliar: 1.25,
  },
];

const COMIENZO_ESCENAS = DURACION_FRASE * PROBLEMA.length;
const DURACION_ESCENAS = ESCENAS.reduce((n, e) => n + e.duracion, 0);
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENAS;

export const DURACION_PRECIO = COMIENZO_CIERRE + DURACION_CIERRE;

export function VideoPrecio() {
  let reloj = COMIENZO_ESCENAS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      {PROBLEMA.map((texto, i) => (
        <Sequence key={texto} from={DURACION_FRASE * i} durationInFrames={DURACION_FRASE}>
          <Frase texto={texto} duracion={DURACION_FRASE} />
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
            <Escena {...escena} lado={i % 2 === 0 ? 1 : -1} capitulo="El precio" />
          </Sequence>
        );
      })}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Míralo antes de decir que sí." tamanoLogo={170} />
      </Sequence>

      <Avance total={DURACION_PRECIO} />
    </AbsoluteFill>
  );
}
