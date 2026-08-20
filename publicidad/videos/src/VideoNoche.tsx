import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FondoNoche } from './FondoNoche';
import { Avance, Cierre, Frase } from './Piezas';
import { color, trozos } from './Texto';
import { COLOR, LETRA, LETRA_SERIF, VIDEO } from './marca';

/*
  "Las tres cosas": 18 segundos, de noche y sin una sola pantalla.

  OTRO ESTILO, no otro enfoque. Los otros cuatro videos son de dia, en crema, y
  giran alrededor de un celular o un portatil. Este es lo contrario: fondo
  oscuro, puro texto, y ni un aparato en todo el video. Un carrete lleno de
  publicidad clara se vuelve un muro parejo; el que va oscuro se ve raro y por
  eso se mira.

  DE DONDE SALE. La pagina del proyecto lo dice con estas palabras: son tres
  cosas que uno solo descubre cuando ya firmo y pago. Ese es el video entero.
  No hay que inventar nada porque el argumento ya estaba escrito.

  SIN NUMEROS INVENTADOS. Da la tentacion de abrir con "el 70% de los
  estudiantes...", que es lo que hace todo el mundo, pero ese dato no existe.
  Las tres preguntas son verificables una por una en la plataforma, y esa es la
  unica razon por la que se pueden decir.

  ESTA ESCRITO COMO SE HABLA. "Me estaran viendo la cara", "son cuarenta
  minutos de subida", "el barrio como es en serio". Antes decia cosas como
  "como es esa cuadra a las nueve de la noche" y sonaba a folleto: nadie dice
  eso. Una frase de publicidad que nadie diria en voz alta se siente falsa
  aunque el argumento sea bueno.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_ENTRADA = s(3.5);
const DURACION_PREGUNTA = s(3);
const DURACION_REMATE = s(3);
const DURACION_CIERRE = s(2.5);

/*
  Las tres preguntas, dichas como las dice la gente.

  Antes decian cosas como "como es esa cuadra a las nueve de la noche", que es
  una frase de folleto: nadie habla asi. Un estudiante que esta mirando una
  habitacion piensa "me estaran viendo la cara" y "sera que si queda cerca".
  Esas son las palabras que hay que usar, no las de un informe.
*/
const PREGUNTAS = [
  ['¿Ese precio es lo normal', 'o me están viendo', 'la cara?'],
  ['¿Sí queda cerca', 'o son cuarenta minutos', 'de subida?'],
  ['¿Y el barrio', 'cómo es', 'en serio?'],
];

const COMIENZO_PREGUNTAS = DURACION_ENTRADA;
const COMIENZO_REMATE = COMIENZO_PREGUNTAS + DURACION_PREGUNTA * PREGUNTAS.length;
const COMIENZO_CIERRE = COMIENZO_REMATE + DURACION_REMATE;

export const DURACION_NOCHE = COMIENZO_CIERRE + DURACION_CIERRE;

/**
 * Una pregunta, con su numero.
 *
 * El numero va enorme y hueco, solo con el contorno. Relleno competiria con la
 * pregunta, que es lo unico que hay que leer; hueco se lee como una marca de
 * agua de revista y deja el peso donde tiene que estar. Ademas de noche una
 * cifra rellena de naranja se convierte en una mancha.
 */
function Pregunta({ lineas, numero }: { lineas: string[]; numero: number }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cifra = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 70 } });
  const salida = interpolate(cuadro, [DURACION_PREGUNTA - 9, DURACION_PREGUNTA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        justifyContent: 'center',
        padding: '0 90px',
        opacity: salida,
      }}
    >
      <p
        style={{
          margin: '0 0 34px',
          fontFamily: LETRA_SERIF,
          fontSize: 250,
          fontWeight: 700,
          lineHeight: 0.82,
          color: 'transparent',
          WebkitTextStroke: `4px ${COLOR.terracotaClaro}`,
          opacity: cifra * 0.85,
          transform: `translateX(${interpolate(cifra, [0, 1], [-70, 0])}px)`,
        }}
      >
        {numero}
      </p>

      {lineas.map((linea, i) => {
        const entrada = spring({
          frame: cuadro - 6 - i * 6,
          fps,
          config: { damping: 200, stiffness: 95 },
        });
        return (
          <div key={linea} style={{ overflow: 'hidden', paddingBottom: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 82,
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: -2,
                color: COLOR.cremaTexto,
                transform: `translateY(${interpolate(entrada, [0, 1], [110, 0])}%)`,
                filter: `blur(${interpolate(entrada, [0, 1], [12, 0])}px)`,
              }}
            >
              {linea}
            </p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * El remate, con las tres preguntas ya hechas.
 *
 * Es la frase de la pagina del proyecto, palabra por palabra pero mas lenta que
 * en los otros videos: es la unica linea del video que hay que entender
 * entera, no ojear.
 */
function Remate() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const salida = interpolate(cuadro, [DURACION_REMATE - 10, DURACION_REMATE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        justifyContent: 'center',
        padding: '0 90px',
        opacity: salida,
      }}
    >
      <p
        style={{
          fontSize: 78,
          fontWeight: 800,
          lineHeight: 1.18,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 18px',
        }}
      >
        {trozos('Tres cosas que uno descubre cuando *ya firmó y pagó.*').map(
          ({ palabra, fuerte }, i) => {
            const entrada = spring({
              frame: cuadro - i * 3,
              fps,
              config: { damping: 200, stiffness: 120 },
            });
            return (
              <span
                key={palabra + i}
                style={{
                  color: color(fuerte, true),
                  opacity: entrada,
                  transform: `translateY(${interpolate(entrada, [0, 1], [26, 0])}px)`,
                  filter: `blur(${interpolate(entrada, [0, 1], [11, 0])}px)`,
                  display: 'inline-block',
                }}
              >
                {palabra}
              </span>
            );
          },
        )}
      </p>
    </AbsoluteFill>
  );
}

export function VideoNoche() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.noche }}>
      <FondoNoche />

      <Sequence durationInFrames={DURACION_ENTRADA}>
        <Frase
          texto="Antes de firmar, uno no sabe *tres cosas.*"
          duracion={DURACION_ENTRADA}
          oscuro
        />
      </Sequence>

      {PREGUNTAS.map((lineas, i) => (
        <Sequence
          key={lineas[0]}
          from={COMIENZO_PREGUNTAS + DURACION_PREGUNTA * i}
          durationInFrames={DURACION_PREGUNTA}
        >
          <Pregunta lineas={lineas} numero={i + 1} />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_REMATE} durationInFrames={DURACION_REMATE}>
        <Remate />
      </Sequence>

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Aquí lo sabes antes." tamanoLogo={175} oscuro />
      </Sequence>

      <Avance total={DURACION_NOCHE} oscuro />
    </AbsoluteFill>
  );
}
