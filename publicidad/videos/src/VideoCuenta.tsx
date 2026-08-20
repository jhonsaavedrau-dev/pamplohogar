import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "Las cifras": 15 segundos, sobre terracota.

  ESTILO: fondo de color entero y cifras enormes que suben contando. Es la
  tercera piel de la marca -- estan la clara, la de noche y esta -- y es la que
  mas se ve de lejos. En un carrete de historias, un bloque naranja completo
  frena el dedo antes de que el ojo lea nada.

  LOS NUMEROS SUBEN, no aparecen. Ver una cifra contando obliga a esperar a que
  se detenga, y esa espera de medio segundo es toda la atencion que necesita un
  video corto.

  SON CIFRAS DE VERDAD, las que responde la plataforma hoy: la mediana de una
  habitacion en Pamplona son 320.000, el mas cerca de la Unipamplona esta a 200
  metros y hay diez barrios con algo publicado. Por eso el ultimo cartel dice
  "de lo que hay publicado hoy" y no "de Pamplona": lo primero es comprobable y
  lo segundo no.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_CIFRA = s(3.4);
const DURACION_CIERRE = s(2.8);

/*
  El paso es de cuanto en cuanto sube el contador.

  Sin el, la cifra pasaba por numeros como 319.992 y se quedaba ahi medio
  segundo antes de cuadrar. Nadie escribe un arriendo asi, y ver esa cifra rara
  hace dudar de todas las demas. Contando de mil en mil siempre se ve una
  cantidad que alguien podria decir en voz alta.
*/
const CIFRAS = [
  { hasta: 320000, paso: 1000, prefijo: '$ ', arriba: 'Lo típico por una habitación', abajo: 'Si te piden más, lo vas a saber.' },
  { hasta: 200, paso: 10, sufijo: ' m', arriba: 'El más cerca de la Unipamplona', abajo: 'La distancia medida, no a ojo.' },
  { hasta: 10, paso: 1, arriba: 'Barrios con algo publicado', abajo: 'Y cada uno con su precio.' },
];

const COMIENZO_CIERRE = DURACION_CIFRA * CIFRAS.length;
export const DURACION_CUENTA = COMIENZO_CIERRE + DURACION_CIERRE;

/** Separa los miles con punto, como se escribe la plata en Colombia. */
const conPuntos = (n: number) => n.toLocaleString('es-CO');

function Cifra({
  hasta,
  paso,
  prefijo = '',
  sufijo = '',
  arriba,
  abajo,
}: {
  hasta: number;
  paso: number;
  prefijo?: string;
  sufijo?: string;
  arriba: string;
  abajo: string;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sube rapido y frena, que es como se detiene un contador de verdad.
  const avance = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 32 } });
  const valor = Math.round(interpolate(avance, [0, 1], [0, hasta]) / paso) * paso;

  const encabezado = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 110 } });
  const pie = spring({
    frame: cuadro - Math.round(fps * 1.5),
    fps,
    config: { damping: 200, stiffness: 100 },
  });
  const salida = interpolate(cuadro, [DURACION_CIFRA - 9, DURACION_CIFRA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        textAlign: 'center',
        opacity: salida,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'rgba(255,247,240,0.72)',
          opacity: encabezado,
          transform: `translateY(${interpolate(encabezado, [0, 1], [20, 0])}px)`,
        }}
      >
        {arriba}
      </p>

      <p
        style={{
          margin: '26px 0 0',
          fontSize: 168,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: -6,
          color: COLOR.crema,
          // Un latido minimo al detenerse, para que no se congele.
          transform: `scale(${interpolate(avance, [0, 1], [0.86, 1])})`,
        }}
      >
        {prefijo}
        {conPuntos(valor)}
        {sufijo}
      </p>

      <p
        style={{
          margin: '34px 0 0',
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: -1,
          color: 'rgba(255,247,240,0.9)',
          opacity: pie,
          transform: `translateY(${interpolate(pie, [0, 1], [22, 0])}px)`,
        }}
      >
        {abajo}
      </p>
    </AbsoluteFill>
  );
}

export function VideoCuenta() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.terracota }}>
      {/* Las tejas del centro historico, aqui en claro sobre el naranja. */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.18 }} width="100%" height="100%">
        <defs>
          <pattern id="tejas-cuenta" width="54" height="27" patternUnits="userSpaceOnUse">
            <path
              d="M0 27C0 12 12 0 27 0s27 12 27 27"
              fill="none"
              stroke="rgba(255,247,240,0.55)"
              strokeWidth="1.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tejas-cuenta)" />
      </svg>

      {CIFRAS.map((cifra, i) => (
        <Sequence key={cifra.arriba} from={DURACION_CIFRA * i} durationInFrames={DURACION_CIFRA}>
          <Cifra {...cifra} />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
          <Cierre remate="De lo que hay publicado hoy." tamanoLogo={180} />
        </AbsoluteFill>
      </Sequence>

      <Avance total={DURACION_CUENTA} />
    </AbsoluteFill>
  );
}
