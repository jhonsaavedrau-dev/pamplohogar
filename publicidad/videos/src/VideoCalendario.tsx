import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { Antetitulo, Pie, Titular, ZONA } from './Titulo';
import { COLOR, LETRA, LETRA_SERIF, VIDEO } from './marca';

/*
  "Los días que no vuelven": 16 segundos, para arrendadores.

  ESTILO: un calendario de pared al que se le arrancan las hojas. Cada hoja
  cae y debajo aparece la siguiente, cada vez mas rapido, mientras el letrero
  de DESOCUPADA se queda quieto. El contraste entre lo que corre y lo que no se
  mueve es todo el video.

  EL ARGUMENTO ES EL TIEMPO, no el dinero. Decirle a un arrendador cuanta plata
  pierde suena a que uno le esta haciendo cuentas ajenas, y ademas habria que
  inventarse la cifra. El tiempo si es suyo y no hay que calcularlo: los dias
  que la habitacion lleva sola los sabe el mejor que nadie.

  Y LA TEMPORADA MANDA. En Pamplona las habitaciones se llenan cuando arranca
  semestre y despues se quedan quietas hasta el siguiente. Por eso el remate no
  es "publique" sino "publiquela antes de que arranque el semestre": es la unica
  urgencia que es verdad.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_CALENDARIO = s(9);
const DURACION_ESCENA = s(3.6);
const DURACION_CIERRE = s(2.6);

const HOJAS = [
  { dia: '01', mes: 'Lunes' },
  { dia: '04', mes: 'Jueves' },
  { dia: '09', mes: 'Martes' },
  { dia: '15', mes: 'Lunes' },
  { dia: '22', mes: 'Lunes' },
  { dia: '30', mes: 'Martes' },
];

const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: ['Publicada, la ven', 'los que buscan hoy'],
    movimiento: 'bajar',
    desde: 0.05,
    hasta: 0.26,
  },
];

const COMIENZO_ESCENAS = DURACION_CALENDARIO;
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENA * ESCENAS.length;
export const DURACION_VIDEO_CALENDARIO = COMIENZO_CIERRE + DURACION_CIERRE;

function Calendario() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 60 } });
  const sentencia = Math.round(fps * 6.4);
  const salida = interpolate(cuadro, [DURACION_CALENDARIO - 12, DURACION_CALENDARIO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
        <div style={{ position: 'relative', width: 560, height: 640, opacity: entrada }}>
          {/* Las hojas van al reves para que la primera quede encima. */}
          {HOJAS.map((hoja, i) => {
            const indice = HOJAS.length - 1 - i;
            const arranca = spring({
              frame: cuadro - Math.round(fps * (1.4 + indice * 0.78)),
              fps,
              config: { damping: 15, mass: 0.6, stiffness: 100 },
            });
            // La ultima hoja no se arranca: es la que queda.
            const cae = indice === HOJAS.length - 1 ? 0 : arranca;

            return (
              <div
                key={hoja.dia}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#FDFBF6',
                  borderRadius: 26,
                  border: '2px solid rgba(31,27,23,0.08)',
                  boxShadow: '0 26px 46px -24px rgba(31,27,23,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transformOrigin: 'top center',
                  transform: `translateY(${cae * 1400}px) rotate(${cae * (indice % 2 === 0 ? 16 : -14)}deg)`,
                  opacity: 1 - cae * 0.8,
                }}
              >
                {/* Los dos agujeros de la argolla. */}
                <div style={{ position: 'absolute', top: 30, display: 'flex', gap: 200 }}>
                  {[0, 1].map((n) => (
                    <div
                      key={n}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: '#EDE7DE' }}
                    />
                  ))}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontFamily: LETRA_SERIF,
                    fontSize: 300,
                    fontWeight: 700,
                    lineHeight: 0.9,
                    color: COLOR.piedra,
                  }}
                >
                  {hoja.dia}
                </p>
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: 6,
                    textTransform: 'uppercase',
                    color: COLOR.piedraSuave,
                  }}
                >
                  {hoja.mes}
                </p>
              </div>
            );
          })}

          {/* El letrero que no se mueve. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -46,
              marginLeft: -190,
              width: 380,
              textAlign: 'center',
              padding: '18px 0',
              background: COLOR.terracota,
              color: '#fff',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 5,
              borderRadius: 16,
              transform: 'rotate(-3deg)',
              boxShadow: '0 18px 34px -18px rgba(140,64,19,0.7)',
            }}
          >
            DESOCUPADA
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ padding: `${ZONA.arriba}px ${ZONA.lados}px 0` }}>
        <Antetitulo texto="Para arrendadores" />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', padding: `0 ${ZONA.lados}px ${ZONA.abajo}px` }}
      >
        <Titular lineas={['Un mes desocupada', '*no se recupera.*']} tamano={62} retraso={sentencia} />
        <Pie texto="Y los estudiantes buscan todos al mismo tiempo." retraso={sentencia + 10} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoCalendario() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_CALENDARIO}>
        <Calendario />
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
        <Cierre remate="Antes de que arranque el semestre." tamanoLogo={175} />
      </Sequence>

      <Avance total={DURACION_VIDEO_CALENDARIO} />
    </AbsoluteFill>
  );
}
