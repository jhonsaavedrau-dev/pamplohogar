import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Avance, Cierre } from './Piezas';
import { Titular } from './Titulo';
import { COLOR, LETRA, LETRA_SERIF, VIDEO } from './marca';

/*
  "Lo mismo, contado de dos maneras": 16 segundos, para arrendadores.

  ESTILO: pantalla partida de arriba abajo, y partida TODO el video. No es una
  transicion: las dos mitades conviven desde el primer cuadro hasta el ultimo.
  Arriba, el aviso del poste, que dice tres cosas y se queda quieto. Abajo, la
  misma habitacion publicada, que se va llenando de datos mientras el aviso no
  se mueve.

  POR QUE PARTIDA Y NO UNA DESPUES DE OTRA. Puestas en fila, el que mira
  compara de memoria, y la memoria es floja. Puestas al tiempo, la comparacion
  la hace el ojo solo y no hay que explicar nada.

  ES LA MISMA HABITACION EN LAS DOS MITADES: la de Chichira, 300.000. Si
  fueran distintas, la comparacion no valdria y ademas seria una trampa.

  LA MITAD DE ARRIBA NO SE RIDICULIZA. El aviso esta bien hecho, con su letra
  clara. El punto no es que este mal: es que ahi cabe eso y nada mas.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_PARTIDA = s(13);
const DURACION_CIERRE = s(3);

export const DURACION_CONTRASTE = DURACION_PARTIDA + DURACION_CIERRE;

/** Lo que va apareciendo abajo, y en que segundo. */
const DATOS = [
  { etiqueta: 'Precio', valor: '$ 300.000 al mes', en: 2.2 },
  { etiqueta: 'Barrio', valor: 'Chichira', en: 3.4 },
  { etiqueta: 'Hasta la U', valor: '700 m, medidos', en: 4.6 },
  { etiqueta: 'Servicios', valor: 'Wifi, agua, luz, cocina', en: 5.8 },
  { etiqueta: 'Comparado', valor: 'Está en lo normal del barrio', en: 7.0 },
  { etiqueta: 'Fotos', valor: '3, y se ven grandes', en: 8.2 },
  { etiqueta: 'Opiniones', valor: '3 del barrio, 4 del dueño', en: 9.4 },
];

function Partida() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 60 } });
  const salida = interpolate(cuadro, [DURACION_PARTIDA - 14, DURACION_PARTIDA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const remate = Math.round(fps * 10.6);

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      {/* ---------------------------------------------------- arriba: el aviso */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 760,
          background: '#EDEAE4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Sin color: el aviso es del mundo de antes.
          filter: 'saturate(0.1)',
          opacity: entrada,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 44,
            left: 60,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
            color: COLOR.piedraSuave,
          }}
        >
          EN EL POSTE
        </span>

        <div
          style={{
            width: 560,
            background: '#FDFBF6',
            padding: '46px 40px',
            textAlign: 'center',
            transform: 'rotate(-1.5deg)',
            boxShadow: '0 20px 36px -22px rgba(31,27,23,0.5)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: LETRA_SERIF,
              fontSize: 74,
              fontWeight: 700,
              letterSpacing: 2,
              color: COLOR.piedra,
            }}
          >
            SE ARRIENDA
          </p>
          <p style={{ margin: '18px 0 0', fontSize: 36, fontWeight: 600, color: COLOR.piedraGris }}>
            Habitación
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 500, color: COLOR.piedraSuave }}>
            Informes: 300 000 0000
          </p>
        </div>

        <p style={{ margin: '38px 0 0', fontSize: 34, fontWeight: 700, color: COLOR.piedraGris }}>
          Tres renglones. Y ya.
        </p>
      </div>

      {/* La costura entre las dos mitades. */}
      <div
        style={{
          position: 'absolute',
          top: 754,
          left: 0,
          right: 0,
          height: 8,
          background: COLOR.terracota,
        }}
      />

      {/* ------------------------------------------ abajo: la misma, publicada */}
      <div
        style={{
          position: 'absolute',
          top: 762,
          left: 0,
          right: 0,
          bottom: 0,
          background: COLOR.crema,
          overflow: 'hidden',
          opacity: entrada,
        }}
      >
        <Img
          src={staticFile('capturas/celular/1-portada.png')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Muy tenue y desenfocada: es textura, no contenido. Al 6% y
            // nitida todavia se le leia "Elige mejor" por detras de la lista y
            // peleaba con lo que hay que leer.
            opacity: 0.05,
            filter: 'blur(4px)',
          }}
        />

        <div style={{ position: 'relative', padding: '40px 60px 0' }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 5,
              color: COLOR.terracota,
            }}
          >
            EN PAMPLOHOGAR
          </span>

          <div style={{ marginTop: 26 }}>
            {DATOS.map((dato) => {
              const aparece = spring({
                frame: cuadro - Math.round(fps * dato.en),
                fps,
                config: { damping: 200, stiffness: 150 },
              });
              return (
                <div
                  key={dato.etiqueta}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 18,
                    marginBottom: 16,
                    opacity: aparece,
                    transform: `translateX(${interpolate(aparece, [0, 1], [-34, 0])}px)`,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: COLOR.terracota,
                      color: '#fff',
                      fontSize: 17,
                      lineHeight: '26px',
                      textAlign: 'center',
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontSize: 33, fontWeight: 700, color: COLOR.piedraSuave, minWidth: 210 }}>
                    {dato.etiqueta}
                  </span>
                  <span style={{ fontSize: 35, fontWeight: 700, color: COLOR.piedra }}>
                    {dato.valor}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 26 }}>
            <Titular lineas={['La misma habitación.', '*Contada completa.*']} tamano={54} retraso={remate} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function VideoContraste() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Sequence durationInFrames={DURACION_PARTIDA}>
        <Partida />
      </Sequence>

      <Sequence from={DURACION_PARTIDA} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Publique la suya hoy." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_CONTRASTE} />
    </AbsoluteFill>
  );
}
