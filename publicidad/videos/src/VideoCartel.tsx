import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { Antetitulo, Pie, Titular, ZONA } from './Titulo';
import { COLOR, LETRA, LETRA_SERIF, VIDEO } from './marca';

/*
  "El cartel": 18 segundos, para arrendadores.

  ESTILO: papel. Un aviso de SE ARRIENDA pegado en un poste, con los flequitos
  del telefono abajo, y los flequitos se van arrancando de a uno hasta que no
  queda ninguno. Todo dibujado con codigo: el papel, la cinta, los cortes.

  POR QUE ESTE OBJETO Y NO OTRO. En Pamplona ese cartel existe de verdad y
  todos lo han visto. Empezar por algo que el arrendador reconoce en un segundo
  vale mas que cualquier titular: antes de leer nada ya sabe de que le estan
  hablando, y de que es suyo el problema.

  EL ARGUMENTO NO ES QUE EL CARTEL ESTE MAL. Es que llega hasta donde llega el
  poste. Decirle a alguien que lleva anos arrendando que lo hace mal es la
  forma mas rapida de que apague el video.

  EL TELEFONO DEL CARTEL ES INVENTADO A PROPOSITO -- 300 000 0000, que no le
  pertenece a nadie -- porque un numero de verdad en un video que circula
  termina sonando en el telefono de una persona.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_CARTEL = s(9.5);
const DURACION_ESCENA = s(3.6);
const DURACION_CIERRE = s(2.6);

const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: ['Aquí lo ve el que', 'está buscando hoy'],
    movimiento: 'bajar',
    desde: 0.05,
    hasta: 0.26,
  },
];

const COMIENZO_ESCENAS = DURACION_CARTEL;
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENA * ESCENAS.length;
export const DURACION_VIDEO_CARTEL = COMIENZO_CIERRE + DURACION_CIERRE;

/** En que segundo se arranca cada flequito. */
const ARRANCADOS = [3.2, 3.9, 4.5, 5.2, 5.8, 6.4];

function Cartel() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 60 } });
  const sentencia = Math.round(fps * 7.2);
  const salida = interpolate(cuadro, [DURACION_CARTEL - 12, DURACION_CARTEL], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // El papel cuelga y se mece apenas, como uno pegado a la intemperie.
  const mecer = Math.sin(cuadro / 34) * 0.7;

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 210 }}>
        <div
          style={{
            width: 700,
            opacity: entrada,
            transformOrigin: 'top center',
            transform: `translateY(${interpolate(entrada, [0, 1], [-70, 0])}px) rotate(${mecer}deg)`,
            filter: 'drop-shadow(0 26px 44px rgba(31,27,23,0.3))',
          }}
        >
          {/* La cinta de enmascarar de la esquina. */}
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: '50%',
              marginLeft: -85,
              width: 170,
              height: 54,
              background: 'rgba(214,196,168,0.85)',
              transform: 'rotate(-3deg)',
            }}
          />

          <div style={{ background: '#FDFBF6', padding: '70px 40px 0', textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontFamily: LETRA_SERIF,
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: 2,
                lineHeight: 1,
                color: COLOR.piedra,
              }}
            >
              SE ARRIENDA
            </p>
            <p style={{ margin: '22px 0 0', fontSize: 40, fontWeight: 600, color: COLOR.piedraGris }}>
              Habitación para estudiante
            </p>
            <p style={{ margin: '10px 0 30px', fontSize: 34, fontWeight: 500, color: COLOR.piedraSuave }}>
              Interesados llamar
            </p>

            {/* La linea por donde se cortan. */}
            <div style={{ borderTop: '3px dashed rgba(31,27,23,0.25)' }} />

            {/* Los flequitos, cortados con tijera. */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {ARRANCADOS.map((en, i) => {
                const arrancado = spring({
                  frame: cuadro - Math.round(fps * en),
                  fps,
                  config: { damping: 14, mass: 0.5, stiffness: 90 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      width: 98,
                      padding: '18px 0 26px',
                      background: '#F6F1E8',
                      borderRight:
                        i === ARRANCADOS.length - 1 ? 'none' : '2px dashed rgba(31,27,23,0.28)',
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: COLOR.piedraGris,
                      opacity: 1 - arrancado,
                      transform: `translateY(${arrancado * 300}px) rotate(${arrancado * (i % 2 === 0 ? 26 : -22)}deg)`,
                    }}
                  >
                    300
                    <br />
                    000
                    <br />
                    0000
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ padding: `${ZONA.arriba}px ${ZONA.lados}px 0` }}>
        <Antetitulo texto="Para arrendadores" />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', padding: `0 ${ZONA.lados}px ${ZONA.abajo}px` }}
      >
        <Titular lineas={['Su aviso llega hasta', 'donde llega *el poste.*']} tamano={62} retraso={sentencia} />
        <Pie texto="Y el que viene de otra ciudad nunca pasa por ahí." retraso={sentencia + 10} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoCartel() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_CARTEL}>
        <Cartel />
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
        <Cierre remate="Publique la suya hoy." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_VIDEO_CARTEL} />
    </AbsoluteFill>
  );
}
