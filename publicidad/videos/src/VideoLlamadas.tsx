import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "Las mismas cinco preguntas": 16 segundos, para arrendadores.

  ESTILO: una lista de llamadas que se va llenando sola. Las entradas caen de
  arriba, se amontonan y empujan a las de abajo fuera del cuadro. No hay
  capturas hasta la segunda mitad.

  EL DOLOR NO ES PUBLICAR, ES CONTESTAR. A quien arrienda no le cuesta trabajo
  poner el aviso: le cuesta contestar catorce veces las mismas preguntas, y a
  las diez de la noche. Ese es el minuto que hay que tocar, no el de "consiga
  inquilinos".

  LOS NUMEROS ESTAN TAPADOS a proposito. Un numero completo en un video que
  circula termina sonando en el telefono de alguien.

  Y LA HORA IMPORTA: la ultima llamada es a las 10:14 p. m. Esa sola linea
  cuenta el problema mejor que cualquier explicacion.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_LISTA = s(8.6);
const DURACION_ESCENA = s(3.6);
const DURACION_CIERRE = s(2.6);

const LLAMADAS = [
  { hora: '7:12 a. m.', pregunta: '¿Todavía está disponible?' },
  { hora: '9:40 a. m.', pregunta: '¿Cuánto es el arriendo?' },
  { hora: '11:05 a. m.', pregunta: '¿Queda lejos de la universidad?' },
  { hora: '2:31 p. m.', pregunta: '¿Incluye servicios?' },
  { hora: '6:58 p. m.', pregunta: '¿Me manda fotos?' },
  { hora: '10:14 p. m.', pregunta: '¿Todavía está disponible?' },
];

const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: ['Todo eso ya está', 'escrito en su publicación'],
    movimiento: 'bajar',
    desde: 0.02,
    hasta: 0.11,
    ampliar: 1.35,
    centroX: 0.42,
  },
];

const COMIENZO_ESCENAS = DURACION_LISTA;
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENA * ESCENAS.length;
export const DURACION_LLAMADAS = COMIENZO_CIERRE + DURACION_CIERRE;

function Lista() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titulo = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 90 } });
  const sentencia = spring({
    frame: cuadro - Math.round(fps * 6.6),
    fps,
    config: { damping: 200, stiffness: 95 },
  });
  const salida = interpolate(cuadro, [DURACION_LISTA - 12, DURACION_LISTA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida, padding: '0 80px' }}>
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <p
          style={{
            margin: '0 0 44px',
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: titulo,
            transform: `translateY(${interpolate(titulo, [0, 1], [24, 0])}px)`,
          }}
        >
          Un día cualquiera
          <br />
          con el aviso puesto.
        </p>

        {LLAMADAS.map((llamada, i) => {
          const cae = spring({
            frame: cuadro - Math.round(fps * (1.1 + i * 0.72)),
            fps,
            config: { damping: 16, mass: 0.6, stiffness: 130 },
          });
          if (cae < 0.01) return null;

          return (
            <div
              key={llamada.hora}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 14,
                padding: '24px 30px',
                background: '#FFFFFF',
                borderRadius: 22,
                border: '2px solid rgba(31,27,23,0.07)',
                boxShadow: '0 14px 28px -18px rgba(31,27,23,0.4)',
                opacity: cae,
                transform: `translateY(${interpolate(cae, [0, 1], [-46, 0])}px)`,
              }}
            >
              {/* El auricular, dibujado con un caracter y no con una imagen. */}
              <div
                style={{
                  width: 58,
                  height: 58,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: '#FDF0E7',
                  color: COLOR.terracota,
                  fontSize: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ☎
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: COLOR.piedra }}>
                  Número desconocido
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 500, color: COLOR.piedraSuave }}>
                  {llamada.pregunta}
                </p>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 27,
                  fontWeight: 700,
                  color: COLOR.piedraGris,
                  whiteSpace: 'nowrap',
                }}
              >
                {llamada.hora}
              </p>
            </div>
          );
        })}

        <p
          style={{
            margin: '38px 0 0',
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: sentencia,
            transform: `translateY(${interpolate(sentencia, [0, 1], [26, 0])}px)`,
          }}
        >
          Las mismas cinco preguntas,
          <br />
          <span style={{ color: COLOR.terracota }}>todos los días.</span>
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoLlamadas() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_LISTA}>
        <Lista />
      </Sequence>

      {ESCENAS.map((escena, i) => (
        <Sequence
          key={escena.captura}
          from={COMIENZO_ESCENAS + DURACION_ESCENA * i}
          durationInFrames={DURACION_ESCENA + 15}
        >
          <Escena {...escena} lado={1} capitulo="Para arrendadores" />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Le escriben cuando ya saben." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_LLAMADAS} />
    </AbsoluteFill>
  );
}
