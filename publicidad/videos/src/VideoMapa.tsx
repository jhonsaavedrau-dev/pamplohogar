import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "El mapa": 18 segundos, a pantalla completa.

  ESTILO: cartografico, sin marco de aparato. El mapa ocupa los 1080 por 1920 y
  se acerca despacio mientras van cayendo los precios de cada barrio. Se parece
  mas a un documental corto que a un anuncio de aplicacion, y esa es la idea:
  el que lo ve no siente que le estan mostrando un producto sino su ciudad.

  QUITAR EL MARCO ES LA DECISION. En todos los demas videos el telefono o el
  portatil recuerdan que esto es una plataforma. Aqui estorbaria: el argumento
  es la ciudad, no la pantalla.

  LOS PRECIOS SON LOS DE VERDAD, los que responde la plataforma hoy para
  habitaciones. La mediana de la ciudad son 320.000, y con eso se entiende de
  una cuales barrios estan por encima y cuales por debajo.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_MAPA = s(15);
const DURACION_CIERRE = s(3);

export const DURACION_VIDEO_MAPA = DURACION_MAPA + DURACION_CIERRE;

/*
  Los barrios, con lo que se cobra por una habitacion.

  Van de menor a mayor a proposito: la cifra sube mientras el mapa se acerca, y
  al final queda arriba la mas cara al lado de la mas barata. Ese salto es el
  argumento entero del video.
*/
const BARRIOS = [
  { barrio: 'Santa Marta', precio: '$ 250.000', en: 1.4, x: 22, y: 30 },
  { barrio: 'Chichira', precio: '$ 300.000', en: 3.2, x: 62, y: 24 },
  { barrio: 'El Buque', precio: '$ 320.000', en: 5.0, x: 30, y: 52 },
  { barrio: 'El Escorial', precio: '$ 380.000', en: 6.8, x: 68, y: 58 },
  { barrio: 'Centro', precio: '$ 450.000', en: 8.6, x: 40, y: 74 },
];

/** Una chapita con el barrio y el precio, clavada en el mapa. */
function Chapa({
  barrio,
  precio,
  x,
  y,
  aparece,
}: {
  barrio: string;
  precio: string;
  x: number;
  y: number;
  aparece: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        opacity: aparece,
        // Cae desde arriba y se clava: es como se lee un alfiler en un mapa.
        transform: `translate(-50%, -100%) translateY(${interpolate(aparece, [0, 1], [-60, 0])}px) scale(${interpolate(aparece, [0, 1], [0.8, 1])})`,
      }}
    >
      <div
        style={{
          background: COLOR.piedra,
          color: '#fff',
          borderRadius: 22,
          padding: '18px 26px',
          textAlign: 'center',
          boxShadow: '0 18px 34px -14px rgba(31,27,23,0.6)',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, opacity: 0.7 }}>
          {barrio.toUpperCase()}
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1, color: COLOR.terracotaClaro }}>
          {precio}
        </div>
      </div>
      {/* La punta del alfiler. */}
      <div
        style={{
          width: 0,
          height: 0,
          margin: '0 auto',
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: `18px solid ${COLOR.piedra}`,
        }}
      />
    </div>
  );
}

function Mapa() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Un acercamiento largo y parejo. La captura es de 2560 de ancho, asi que
  // hasta 1,55 sigue por debajo de su tamano real.
  const acercar = interpolate(cuadro, [0, DURACION_MAPA], [1.15, 1.55]);
  const salida = interpolate(cuadro, [DURACION_MAPA - 14, DURACION_MAPA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titulo = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 80 } });
  const remate = spring({
    frame: cuadro - Math.round(fps * 10.6),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida, overflow: 'hidden' }}>
      <AbsoluteFill>
        <Img
          src={staticFile('capturas/computador/5-mapa-precios.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 62%',
            transform: `scale(${acercar})`,
          }}
        />
      </AbsoluteFill>

      {/* Un velo para que las chapitas se despeguen del mapa. */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,247,240,0.92) 0%, rgba(255,247,240,0.18) 26%, rgba(255,247,240,0.18) 62%, rgba(255,247,240,0.95) 88%)',
        }}
      />

      <AbsoluteFill style={{ padding: '96px 90px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 74,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: titulo,
            transform: `translateY(${interpolate(titulo, [0, 1], [24, 0])}px)`,
          }}
        >
          Una habitación en Pamplona
          <br />
          no cuesta lo mismo <span style={{ color: COLOR.terracota }}>en todas partes.</span>
        </p>
      </AbsoluteFill>

      {BARRIOS.map((b) => (
        <Chapa
          key={b.barrio}
          {...b}
          aparece={spring({
            frame: cuadro - Math.round(fps * b.en),
            fps,
            config: { damping: 14, mass: 0.6, stiffness: 120 },
          })}
        />
      ))}

      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 90px 150px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: remate,
            transform: `translateY(${interpolate(remate, [0, 1], [28, 0])}px)`,
          }}
        >
          El mapa te dice dónde
          <br />
          te alcanza la plata.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoMapa() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Sequence durationInFrames={DURACION_MAPA}>
        <Mapa />
      </Sequence>

      <Sequence from={DURACION_MAPA} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Mira el mapa antes de mudarte." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_VIDEO_MAPA} />
    </AbsoluteFill>
  );
}
