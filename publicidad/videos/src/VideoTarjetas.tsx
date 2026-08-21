import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { Antetitulo, Pie, Titular, ZONA } from './Titulo';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "La baraja": 15 segundos, repartiendo cartas.

  ESTILO: naipes. Las publicaciones caen una encima de otra como quien reparte
  una mano, cada una girada un poco distinto, y al final se abren en abanico y
  quedan las cinco a la vista. Ni capturas ni marcos de telefono: las cartas
  estan dibujadas con codigo, con la letra y los colores de la marca.

  POR QUE CARTAS. Es el unico formato que deja mostrar CINCO cosas a la vez sin
  que ninguna se pierda, y ademas tiene ritmo propio: repartir es tas, tas,
  tas. Ese ritmo es el que hace que un video corto no se sienta apurado sino
  vivo.

  LAS CINCO SON PUBLICACIONES DE VERDAD, con su barrio, su precio y sus metros
  hasta la Unipamplona tal como los responde la plataforma hoy.

  LOS GIROS ESTAN ESCRITOS A MANO y no sorteados. Sorteados, cada cuadro
  tendria los suyos y las cartas temblarian.

AL FINAL SE ABREN HACIA ABAJO, no en abanico. Cinco cartas de 540 no caben
  abiertas en 1080 de ancho por mucho que se giren: se tapan el precio unas a
  otras. Corridas hacia abajo, cada una deja ver su franja de arriba, y en la
  franja de arriba esta lo unico que hay que leer, que es cuanto vale.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_BARAJA = s(12);
const DURACION_CIERRE = s(3);

export const DURACION_TARJETAS = DURACION_BARAJA + DURACION_CIERRE;

const CARTAS = [
  { barrio: 'Santa Marta', precio: '$ 250.000', tipo: 'Habitación', hasta: '900 m de la U', giro: -7, abanico: -24 },
  { barrio: 'Chichira', precio: '$ 300.000', tipo: 'Habitación', hasta: '700 m de la U', giro: 5, abanico: -12 },
  { barrio: 'El Buque', precio: '$ 320.000', tipo: 'Habitación', hasta: '1,1 km de la U', giro: -4, abanico: 0 },
  { barrio: 'El Escorial', precio: '$ 380.000', tipo: 'Habitación', hasta: '200 m de la U', giro: 8, abanico: 12 },
  { barrio: 'San Francisco', precio: '$ 1.100.000', tipo: 'Apartamento', hasta: '1 km de la U', giro: -6, abanico: 24 },
];

function Baraja() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const salida = interpolate(cuadro, [DURACION_BARAJA - 14, DURACION_BARAJA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A los 7 segundos el monton se abre en abanico.
  const abrir = spring({
    frame: cuadro - Math.round(fps * 7),
    fps,
    config: { damping: 200, stiffness: 55 },
  });

  const remate = Math.round(fps * 8.8);

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill style={{ padding: `${ZONA.arriba}px ${ZONA.lados}px 0` }}>
        <Antetitulo texto="Lo que hay hoy" />
        <Titular lineas={['Cinco habitaciones', 'en *cinco barrios.*']} tamano={72} retraso={6} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
        {CARTAS.map((carta, i) => {
          const cae = spring({
            frame: cuadro - Math.round(fps * (1 + i * 0.85)),
            fps,
            config: { damping: 15, mass: 0.7, stiffness: 130 },
          });

          // Al abrirse, cada carta se corre hacia su renglon y se endereza.
          const sitio = (i - (CARTAS.length - 1) / 2) * 122;
          const giro = interpolate(abrir, [0, 1], [carta.giro, carta.giro * 0.22]);
          const bajar = interpolate(abrir, [0, 1], [0, sitio]);

          return (
            <div
              key={carta.barrio}
              style={{
                position: 'absolute',
                width: 640,
                opacity: cae,
                transform: `translateY(${interpolate(cae, [0, 1], [-700, 0]) + bajar}px) rotate(${giro}deg) scale(${interpolate(cae, [0, 1], [1.15, 1])})`,
                background: '#FFFFFF',
                borderRadius: 26,
                border: '2px solid rgba(31,27,23,0.08)',
                boxShadow: '0 22px 44px -22px rgba(31,27,23,0.5)',
                padding: '26px 32px 30px',
              }}
            >
              {/* Arriba, en una sola franja, lo unico que hay que leer. */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    letterSpacing: -2,
                    color: COLOR.piedra,
                    // Sin esto, "$ 1.100.000" se parte en dos renglones y esa
                    // carta se descuadra de las otras cuatro.
                    whiteSpace: 'nowrap',
                  }}
                >
                  {carta.precio}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 21,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: COLOR.terracota,
                    background: '#FDF6F1',
                    border: `2px solid ${COLOR.terracota}22`,
                    borderRadius: 999,
                    padding: '7px 15px',
                  }}
                >
                  {carta.tipo}
                </span>
              </div>

              <p style={{ margin: '10px 0 0', fontSize: 33, fontWeight: 700, color: COLOR.piedraGris }}>
                {carta.barrio} · <span style={{ color: COLOR.piedraSuave }}>{carta.hasta}</span>
              </p>
            </div>
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', padding: `0 ${ZONA.lados}px ${ZONA.abajo}px` }}
      >
        <Titular lineas={['Con precio y con barrio,', 'de una sola mirada.']} tamano={60} retraso={remate} />
        <Pie texto="Sin llamar a preguntar cuánto." retraso={remate + 10} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoTarjetas() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_BARAJA}>
        <Baraja />
      </Sequence>

      <Sequence from={DURACION_BARAJA} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Todas las cartas sobre la mesa." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_TARJETAS} />
    </AbsoluteFill>
  );
}
