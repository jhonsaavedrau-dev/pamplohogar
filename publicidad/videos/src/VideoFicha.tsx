import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, LETRA_SERIF, VIDEO } from './marca';

/*
  "Se llena sola": 17 segundos, para arrendadores.

  ESTILO: un formulario en papel que se va llenando renglon por renglon, con la
  letra escribiendose, y al final le cae encima un sello de caucho. Es el unico
  de los doce videos donde se ve algo parecido a un tramite, y esta puesto para
  desarmar exactamente ese miedo.

  LA OBJECION QUE RESPONDE. Un arrendador de sesenta anos no dice "no quiero
  publicar": dice "yo no soy bueno para esas cosas". Mostrarle que son cinco
  renglones y ya, y que la plataforma pone sola lo dificil -- los metros hasta
  la universidad, con que se compara el precio -- vale mas que cualquier
  promesa de que es facil.

  LOS DOS ULTIMOS RENGLONES VAN EN NARANJA porque no los escribe el. Esa es la
  parte que sorprende, y por eso llega despues y con otro color.

  EL SELLO CAE TORCIDO Y REBOTA. Un sello perfectamente derecho se ve impreso;
  uno torcido se ve puesto por una mano.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_FORMULARIO = s(14);
const DURACION_CIERRE = s(3);

export const DURACION_FICHA = DURACION_FORMULARIO + DURACION_CIERRE;

const RENGLONES = [
  { campo: 'Qué arrienda', valor: 'Habitación', en: 1.4 },
  { campo: 'Barrio', valor: 'Chichira', en: 2.6 },
  { campo: 'Cuánto', valor: '$ 300.000', en: 3.8 },
  { campo: 'Fotos', valor: '3', en: 5.0 },
  { campo: 'Hasta la universidad', valor: '700 m', en: 6.6, deLaPlataforma: true },
  { campo: 'Comparado con el barrio', valor: 'Está en lo normal', en: 8.0, deLaPlataforma: true },
];

/** Escribe el texto de a poco, como si lo estuvieran tecleando. */
function tecleado(texto: string, avance: number) {
  const letras = Math.round(interpolate(avance, [0, 1], [0, texto.length]));
  return texto.slice(0, letras);
}

function Formulario() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 55 } });
  const sello = spring({
    frame: cuadro - Math.round(fps * 10),
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 130 },
  });
  const nota = spring({
    frame: cuadro - Math.round(fps * 11.4),
    fps,
    config: { damping: 200, stiffness: 95 },
  });
  const salida = interpolate(cuadro, [DURACION_FORMULARIO - 14, DURACION_FORMULARIO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
        <div
          style={{
            position: 'relative',
            width: 820,
            background: '#FDFBF6',
            borderRadius: 20,
            border: '2px solid rgba(31,27,23,0.1)',
            boxShadow: '0 30px 56px -26px rgba(31,27,23,0.4)',
            padding: '54px 58px 60px',
            opacity: entrada,
            transform: `translateY(${interpolate(entrada, [0, 1], [60, 0])}px)`,
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: LETRA_SERIF,
              fontSize: 52,
              fontWeight: 700,
              color: COLOR.piedra,
            }}
          >
            Publicar una habitación
          </p>
          <div style={{ height: 4, width: 120, background: COLOR.terracota, marginBottom: 40 }} />

          {RENGLONES.map((renglon) => {
            const escribiendo = spring({
              frame: cuadro - Math.round(fps * renglon.en),
              fps,
              config: { damping: 200, stiffness: 60 },
            });
            return (
              <div key={renglon.campo} style={{ marginBottom: 26, opacity: escribiendo > 0 ? 1 : 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: renglon.deLaPlataforma ? COLOR.terracota : COLOR.piedraSuave,
                  }}
                >
                  {renglon.campo}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    paddingBottom: 10,
                    borderBottom: '2px solid rgba(31,27,23,0.12)',
                    fontSize: 46,
                    fontWeight: 700,
                    minHeight: 58,
                    color: renglon.deLaPlataforma ? COLOR.terracota : COLOR.piedra,
                  }}
                >
                  {tecleado(renglon.valor, escribiendo)}
                </p>
              </div>
            );
          })}

          {/* El sello de caucho. */}
          <div
            style={{
              position: 'absolute',
              right: 40,
              bottom: 46,
              padding: '16px 30px',
              border: `7px solid ${COLOR.terracota}`,
              borderRadius: 14,
              color: COLOR.terracota,
              fontSize: 50,
              fontWeight: 800,
              letterSpacing: 5,
              opacity: sello * 0.9,
              transform: `rotate(-11deg) scale(${interpolate(sello, [0, 1], [2.4, 1])})`,
            }}
          >
            PUBLICADA
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 90px 130px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.16,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: nota,
            transform: `translateY(${interpolate(nota, [0, 1], [26, 0])}px)`,
          }}
        >
          Usted pone cuatro datos.
          <br />
          <span style={{ color: COLOR.terracota }}>El resto lo pone la página.</span>
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function VideoFicha() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_FORMULARIO}>
        <Formulario />
      </Sequence>

      <Sequence from={DURACION_FORMULARIO} durationInFrames={DURACION_CIERRE}>
        <Cierre remate="Sin saber de computadores." tamanoLogo={180} />
      </Sequence>

      <Avance total={DURACION_FICHA} />
    </AbsoluteFill>
  );
}
