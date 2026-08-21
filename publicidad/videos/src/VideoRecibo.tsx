import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { Antetitulo, ZONA } from './Titulo';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "El recibo": 16 segundos, en forma de tirilla.

  ESTILO: una tirilla de caja registradora que se va imprimiendo. Nada de
  celulares ni de capturas. Es lo mas lejos que se puede estar de los otros
  videos usando la misma marca, y funciona porque un recibo es exactamente lo
  que se quiere decir: la cuenta clara, item por item, antes de pagar.

  POR QUE FUNCIONA EL FORMATO. Un recibo se lee de arriba abajo sin que nadie
  lo explique, y cada renglon que aparece pide el siguiente. Eso mantiene el
  dedo quieto sin necesidad de un truco.

  LOS DATOS SON DE UNA PUBLICACION DE VERDAD, la de Chichira: 300.000 de
  arriendo cuando lo tipico en la ciudad son 320.000, a 700 metros de la
  Unipamplona. Un recibo con cifras inventadas es lo mismo que un recibo falso.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_TIRILLA = s(13);
const DURACION_CIERRE = s(3);

export const DURACION_RECIBO = DURACION_TIRILLA + DURACION_CIERRE;

const MONO = "'Consolas', 'Courier New', monospace";

/** Cada renglon con el momento en que se imprime, en segundos. */
const RENGLONES: { texto: string; valor?: string; en: number; fuerte?: boolean; raya?: boolean }[] = [
  { texto: 'PAMPLOHOGAR', en: 0.5, fuerte: true },
  { texto: 'Habitación en Chichira', en: 1.1 },
  { texto: '', en: 1.4, raya: true },
  { texto: 'ARRIENDO', valor: '$ 300.000', en: 2.0 },
  { texto: 'LO TÍPICO EN LA CIUDAD', valor: '$ 320.000', en: 3.1 },
  { texto: 'HASTA LA U', valor: '700 m', en: 4.2 },
  { texto: 'SERVICIOS', valor: 'wifi, agua, luz', en: 5.3 },
  { texto: 'OPINIONES DEL BARRIO', valor: '3', en: 6.4 },
  { texto: 'QUÉ DICEN DEL DUEÑO', valor: '4.5 / 5', en: 7.5 },
  { texto: '', en: 8.2, raya: true },
  { texto: 'TOTAL QUE YA SABES', valor: 'TODO', en: 8.9, fuerte: true },
];

/**
 * La tirilla.
 *
 * El papel entra de arriba y se queda; los renglones se imprimen de a uno con
 * un salto minimo, como los da una impresora termica de verdad. Ese salto es
 * lo que hace que se lea como papel y no como una lista con animacion.
 */
function Tirilla() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 55 } });
  const salida = interpolate(cuadro, [DURACION_TIRILLA - 14, DURACION_TIRILLA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Los dientes de sierra de los dos bordes, dibujados con un degradado.
  const diente =
    'linear-gradient(-45deg, transparent 0 12px, #FFFDFA 12px) 0 0 / 24px 24px, ' +
    'linear-gradient(45deg, transparent 0 12px, #FFFDFA 12px) 0 0 / 24px 24px';

  return (
    <AbsoluteFill style={{ opacity: salida }}>
      <AbsoluteFill style={{ padding: `${ZONA.arriba}px ${ZONA.lados}px 0` }}>
        <Antetitulo texto="Antes de ir a verla" />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 110 }}>
      <div
        style={{
          width: 760,
          transform: `translateY(${interpolate(entrada, [0, 1], [-1200, 0])}px)`,
          filter: 'drop-shadow(0 30px 50px rgba(31,27,23,0.25))',
        }}
      >
        <div style={{ height: 24, background: diente, backgroundRepeat: 'repeat-x' }} />

        <div style={{ background: '#FFFDFA', padding: '18px 52px 30px', fontFamily: MONO }}>
          {RENGLONES.map((renglon, i) => {
            const aparece = spring({
              frame: cuadro - Math.round(fps * renglon.en),
              fps,
              config: { damping: 200, stiffness: 200 },
            });

            if (renglon.raya) {
              return (
                <div
                  key={i}
                  style={{
                    margin: '18px 0',
                    borderTop: '3px dashed rgba(31,27,23,0.28)',
                    opacity: aparece,
                  }}
                />
              );
            }

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: renglon.valor ? 'space-between' : 'center',
                  alignItems: 'baseline',
                  gap: 20,
                  padding: '11px 0',
                  fontSize: renglon.fuerte ? 42 : 32,
                  fontWeight: renglon.fuerte ? 700 : 500,
                  letterSpacing: renglon.fuerte ? 3 : 0.5,
                  color: COLOR.piedra,
                  opacity: aparece,
                  // El salto de la impresora: entra un pelo desplazado.
                  transform: `translateY(${interpolate(aparece, [0, 1], [10, 0])}px)`,
                }}
              >
                <span>{renglon.texto}</span>
                {renglon.valor && (
                  <span style={{ fontWeight: 700, color: COLOR.terracota, whiteSpace: 'nowrap' }}>
                    {renglon.valor}
                  </span>
                )}
              </div>
            );
          })}

          <p
            style={{
              margin: '26px 0 0',
              textAlign: 'center',
              fontFamily: LETRA,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.35,
              color: COLOR.piedraGris,
              opacity: spring({
                frame: cuadro - Math.round(fps * 10),
                fps,
                config: { damping: 200, stiffness: 120 },
              }),
            }}
          >
            Todo esto lo sabes
            <br />
            antes de ir a verla.
          </p>
        </div>

        <div
          style={{
            height: 24,
            background: diente,
            backgroundRepeat: 'repeat-x',
            transform: 'rotate(180deg)',
          }}
        />
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoRecibo() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_TIRILLA}>
        <Tirilla />
      </Sequence>

      <Sequence from={DURACION_TIRILLA} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="La cuenta clara, antes." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_RECIBO} />
    </AbsoluteFill>
  );
}
