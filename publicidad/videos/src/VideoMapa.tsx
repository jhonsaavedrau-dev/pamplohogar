import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Avance, Cierre } from './Piezas';
import { Antetitulo, Pie, Titular, ZONA } from './Titulo';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "El barrio decide el precio": 18 segundos, a pantalla completa.

  ESTILO: cartografico, sin marco de aparato. El mapa ocupa los 1080 por 1920 y
  se acerca despacio mientras van cayendo las chapitas con los precios. Se
  parece mas a un documental corto que a un anuncio de aplicacion, y esa es la
  idea: el que lo ve no siente que le estan mostrando un producto sino su
  ciudad.

  QUITAR EL MARCO ES LA DECISION. En los demas videos el telefono o el portatil
  recuerdan que esto es una plataforma. Aqui estorbaria: el argumento es la
  ciudad, no la pantalla.

  EL TEXTO SE REESCRIBIO. Decia "una habitacion en Pamplona no cuesta lo mismo
  en todas partes", que son doce palabras para decir una idea de cuatro y
  ademas suena a informe. Ahora dice lo mismo con el sujeto que importa: el
  barrio decide el precio. En un video de dieciocho segundos, cada palabra de
  mas es medio segundo que el que mira no tiene.

  LAS CHAPITAS ESTAN ENTRE EL 33 Y EL 60 DE ALTURA, ni mas arriba ni mas
  abajo. Arriba va el titular y abajo el remate; una chapita metida ahi tapa
  una palabra y no se ve hasta que el video ya esta publicado.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_MAPA = s(15);
const DURACION_CIERRE = s(3);

export const DURACION_VIDEO_MAPA = DURACION_MAPA + DURACION_CIERRE;

/*
  Los barrios con lo que se cobra por una habitacion.

  Van de menor a mayor: la cifra sube mientras el mapa se acerca, y al final
  quedan a la vista los 250 de Santa Marta al lado de los 450 del Centro. Ese
  salto es el argumento entero del video, y no hay que explicarlo.
*/
const BARRIOS = [
  { barrio: 'Santa Marta', precio: '250', en: 1.6, x: 20, y: 36 },
  { barrio: 'Cristo Rey', precio: '270', en: 2.6, x: 74, y: 34 },
  { barrio: 'Chichira', precio: '300', en: 3.6, x: 46, y: 41 },
  { barrio: 'El Buque', precio: '320', en: 4.6, x: 17, y: 50 },
  { barrio: 'Juan XXIII', precio: '340', en: 5.6, x: 78, y: 48 },
  { barrio: 'El Escorial', precio: '380', en: 6.6, x: 33, y: 57 },
  { barrio: 'Centro', precio: '450', en: 7.6, x: 66, y: 60 },
];

/** Una chapita clavada en el mapa, con el barrio y el precio. */
function Chapa({
  barrio,
  precio,
  x,
  y,
  aparece,
  caro,
}: {
  barrio: string;
  precio: string;
  x: number;
  y: number;
  aparece: number;
  caro: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        opacity: aparece,
        // Cae desde arriba y se clava: es como se lee un alfiler en un mapa.
        transform: `translate(-50%, -100%) translateY(${interpolate(aparece, [0, 1], [-54, 0])}px) scale(${interpolate(aparece, [0, 1], [0.75, 1])})`,
      }}
    >
      <div
        style={{
          // El mas caro va en naranja y los demas en negro. Un solo color
          // distinto en toda la pantalla senala sin necesidad de una flecha.
          background: caro ? COLOR.terracota : COLOR.piedra,
          color: '#fff',
          borderRadius: 18,
          padding: '12px 20px 14px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          boxShadow: '0 16px 30px -12px rgba(31,27,23,0.65)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2.5, opacity: 0.75 }}>
          {barrio.toUpperCase()}
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
          ${precio}
          <span style={{ fontSize: 26, fontWeight: 700, opacity: 0.75 }}>.000</span>
        </div>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          margin: '0 auto',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: `16px solid ${caro ? COLOR.terracota : COLOR.piedra}`,
        }}
      />
    </div>
  );
}

function Mapa() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Un acercamiento largo y parejo. La captura mide 2560 de ancho, asi que
  // hasta 1,55 sigue por debajo de su tamano real y no se emborrona.
  const acercar = interpolate(cuadro, [0, DURACION_MAPA], [1.38, 1.66]);
  const salida = interpolate(cuadro, [DURACION_MAPA - 14, DURACION_MAPA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
            // Encuadrado sobre el lienzo del mapa y no sobre la pagina: mas
            // arriba entraban el titulo de la seccion y las pastillas de tipo,
            // y su letra peleaba con la del video.
            objectPosition: '50% 88%',
            // Un desenfoque corto lo vuelve textura. Sin el, las pastillas de
            // precio que ya trae el mapa se leen al lado de las mias y el ojo
            // no sabe cual de las dos cifras es la buena.
            filter: 'blur(3px) saturate(0.9)',
            transform: `scale(${acercar})`,
          }}
        />
      </AbsoluteFill>

      {/* Dos velos, arriba y abajo, para que el texto se despegue del mapa y
          las chapitas se queden en la franja del medio, que es la unica sin
          velo. */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,247,240,1) 0%, rgba(255,247,240,0.99) 26%, rgba(255,247,240,0.22) 33%, rgba(255,247,240,0.22) 62%, rgba(255,247,240,0.97) 71%, rgba(255,247,240,1) 100%)',
        }}
      />

      <AbsoluteFill style={{ padding: `${ZONA.arriba}px ${ZONA.lados}px 0` }}>
        <Antetitulo texto="El mapa de precios" />
        <Titular lineas={['En Pamplona el barrio', 'decide el *precio.*']} tamano={74} retraso={6} />
      </AbsoluteFill>

      {BARRIOS.map((b, i) => (
        <Chapa
          key={b.barrio}
          {...b}
          caro={i === BARRIOS.length - 1}
          aparece={spring({
            frame: cuadro - Math.round(fps * b.en),
            fps,
            config: { damping: 14, mass: 0.55, stiffness: 130 },
          })}
        />
      ))}

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', padding: `0 ${ZONA.lados}px ${ZONA.abajo}px` }}
      >
        <Titular
          lineas={['Mira el mapa antes', 'de escoger dónde vivir.']}
          tamano={62}
          retraso={Math.round(fps * 9.4)}
        />
        <Pie texto="Barrio por barrio, con lo que se cobra." retraso={Math.round(fps * 10.4)} />
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
        <Cierre remate="El barrio también es precio." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_VIDEO_MAPA} />
    </AbsoluteFill>
  );
}
