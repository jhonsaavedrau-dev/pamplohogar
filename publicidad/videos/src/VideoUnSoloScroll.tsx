import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from './Fondo';
import { MarcoCelular } from './Marcos';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "Un solo scroll": 14 segundos, sin un solo corte.

  ESTILO: una sola toma. El telefono no se mueve, no entra, no sale y no cambia
  de escena en todo el video: lo unico que pasa es que la pagina baja. Todos
  los demas videos estan montados a cortes; este es la excepcion, y por eso se
  nota entre los otros.

  Es el video que mejor demuestra la unica cosa que hay que demostrar aqui: que
  hay que bajar un rato para acabarse el listado. Contarlo con un rotulo no
  convence; verlo bajar diez pantallas si.

  LA VELOCIDAD NO ES PAREJA. Arranca lento, se dispara en el medio y frena al
  final. Un desplazamiento a velocidad constante se ve de maquina; el dedo de
  una persona empuja, suelta y frena, y eso es lo que imita la curva.

  LAS PALABRAS ENCIMA no se mueven con la pagina: entran y salen quietas en el
  mismo sitio, para que el ojo tenga un punto fijo mientras todo lo demas corre.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_TOMA = s(11.5);
const DURACION_CIERRE = s(2.5);

export const DURACION_SCROLL = DURACION_TOMA + DURACION_CIERRE;

/** Que se lee encima, y en que segundo. Cada una dura segundo y medio. */
const PALABRAS = [
  { texto: 'Todos los arriendos', en: 0.8 },
  { texto: 'Con el precio de frente', en: 3.2 },
  { texto: 'Y los minutos hasta la U', en: 5.6 },
  { texto: 'Uno detrás de otro', en: 8.0 },
  { texto: 'Hasta que se acaban', en: 10.0 },
];

function Toma() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Empuja, suelta y frena. La curva es la que hace que parezca un dedo.
  const recorrido = interpolate(cuadro, [0, DURACION_TOMA], [0, 0.62], {
    easing: Easing.bezier(0.5, 0, 0.25, 1),
    extrapolateRight: 'clamp',
  });

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 60 } });
  const salida = interpolate(cuadro, [DURACION_TOMA - 12, DURACION_TOMA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
        <div
          style={{
            opacity: entrada,
            transform: `scale(${interpolate(entrada, [0, 1], [0.94, 1])})`,
          }}
        >
          <MarcoCelular
            captura="capturas/celular/2-listado-largo.png"
            ancho={560}
            recorrido={recorrido}
          />
        </div>
      </AbsoluteFill>

      {/* Las palabras, quietas mientras la pagina corre. */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 132 }}>
        {PALABRAS.map((palabra) => {
          const desde = Math.round(fps * palabra.en);
          const aparece = spring({
            frame: cuadro - desde,
            fps,
            config: { damping: 200, stiffness: 140 },
          });
          const se_va = interpolate(cuadro, [desde + 45, desde + 57], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const visible = aparece * se_va;
          if (visible < 0.01) return null;

          return (
            <p
              key={palabra.texto}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 132,
                margin: 0,
                textAlign: 'center',
                fontSize: 58,
                fontWeight: 800,
                letterSpacing: -1.5,
                color: COLOR.piedra,
                opacity: visible,
                transform: `translateY(${interpolate(aparece, [0, 1], [26, 0])}px)`,
                filter: `blur(${interpolate(aparece, [0, 1], [10, 0])}px)`,
              }}
            >
              {palabra.texto}
            </p>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoUnSoloScroll() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_TOMA}>
        <Toma />
      </Sequence>

      <Sequence from={DURACION_TOMA} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Todos, en un solo sitio." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_SCROLL} />
    </AbsoluteFill>
  );
}
