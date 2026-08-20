import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre } from './Piezas';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  "Antes y despues": 20 segundos, en dos mitades que no se parecen.

  OTRO ESTILO. Los demas videos ensenan la plataforma. Este ensena PRIMERO lo
  otro: ocho segundos de un grupo donde alguien pregunta por una habitacion y
  la conversacion se muere. Sin aparatos, sin capturas, solo burbujas.

  LA PRIMERA MITAD VA SIN COLOR. El fondo de la marca esta ahi, pero
  desaturado: se reconoce y a la vez se siente apagado. Y cuando entra la
  plataforma, un barrido de color devuelve el terracota de golpe. Ese contraste
  es todo el video; contarlo con palabras no funcionaria igual.

  LAS BURBUJAS NO IMITAN NINGUNA APLICACION. Nada de verde, ni check azul, ni
  barra de arriba con una foto de perfil: son rectangulos redondeados en los
  grises de la marca. Se entiende que es un grupo de mensajes sin hacer pasar
  el video por una captura de algo que no es.

  EL DIALOGO ES EL DE VERDAD. "Creo que por El Buque arriendan, no se el
  numero" es exactamente como se responde en esos grupos: con la intencion
  buena y el dato incompleto. Ahi esta el problema entero.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_ACTO1 = s(8.2);
const COMIENZO_BARRIDO = s(7.8);
const DURACION_BARRIDO = s(1.4);
const COMIENZO_ACTO2 = s(8.4);
const DURACION_ESCENA = s(4.5);

const MENSAJES: { texto: string; mio: boolean }[] = [
  { texto: '¿Alguien sabe de una habitación cerca de la U?', mio: true },
  { texto: 'Creo que por El Buque arriendan, no sé el número', mio: false },
  { texto: '¿Y cuánto cobran?', mio: true },
];

const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: ['Todo junto, con precio', 'y con barrio'],
    movimiento: 'bajar',
    desde: 0.04,
    hasta: 0.26,
  },
  {
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: ['Y con qué se compara', 'lo que te están cobrando'],
    movimiento: 'bajar',
    desde: 0.296,
    hasta: 0.341,
    ampliar: 1.6,
    centroX: 0.37,
  },
];

const COMIENZO_CIERRE = COMIENZO_ACTO2 + DURACION_ESCENA * ESCENAS.length;
export const DURACION_ANTES = COMIENZO_CIERRE + s(2.6);

/**
 * El grupo donde se pregunta y no contesta nadie.
 *
 * Los mensajes entran de a uno con su pausa, como se leen de verdad, y al
 * final quedan los tres puntitos latiendo sobre una conversacion que ya se
 * murio. Esa espera es la que hay que sentir: es la misma que se siente con el
 * telefono en la mano.
 */
function Conversacion() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rotulo = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 90 } });
  const espera = spring({
    frame: cuadro - Math.round(fps * 5.2),
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const sentencia = spring({
    frame: cuadro - Math.round(fps * 6.4),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA }}>
      {/* El fondo de la marca, pero apagado. */}
      <AbsoluteFill style={{ filter: 'saturate(0.12) brightness(1.02)' }}>
        <Fondo />
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 54, opacity: rotulo }}>
          <div style={{ height: 8, width: 110 * rotulo, borderRadius: 999, background: COLOR.piedraGris }} />
          <span
            style={{
              fontSize: 29,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: COLOR.piedraGris,
            }}
          >
            Así se busca hoy
          </span>
        </div>

        {MENSAJES.map((mensaje, i) => {
          const entrada = spring({
            frame: cuadro - Math.round(fps * (0.7 + i * 1.35)),
            fps,
            config: { damping: 18, mass: 0.7, stiffness: 110 },
          });
          return (
            <div
              key={mensaje.texto}
              style={{
                display: 'flex',
                justifyContent: mensaje.mio ? 'flex-end' : 'flex-start',
                marginBottom: 22,
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [40, 0])}px) scale(${interpolate(
                  entrada,
                  [0, 1],
                  [0.9, 1],
                )})`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  maxWidth: '82%',
                  fontSize: 46,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: -0.5,
                  padding: '28px 34px',
                  borderRadius: 34,
                  borderBottomRightRadius: mensaje.mio ? 10 : 34,
                  borderBottomLeftRadius: mensaje.mio ? 34 : 10,
                  color: COLOR.piedra,
                  background: mensaje.mio ? '#E4E0DA' : '#FFFFFF',
                  border: mensaje.mio ? 'none' : '2px solid #E4E0DA',
                  boxShadow: '0 10px 24px -14px rgba(31,27,23,0.35)',
                }}
              >
                {mensaje.texto}
              </p>
            </div>
          );
        })}

        {/* Los tres puntitos: la respuesta que nunca llega. */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: espera }}>
          <div
            style={{
              display: 'flex',
              gap: 14,
              padding: '32px 38px',
              borderRadius: 34,
              borderBottomLeftRadius: 10,
              background: '#FFFFFF',
              border: '2px solid #E4E0DA',
            }}
          >
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: COLOR.piedraSuave,
                  opacity: 0.35 + Math.sin(cuadro / 6 - n * 0.9) * 0.35,
                }}
              />
            ))}
          </div>
        </div>

        <p
          style={{
            marginTop: 64,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: -2,
            color: COLOR.piedra,
            opacity: sentencia,
            transform: `translateY(${interpolate(sentencia, [0, 1], [26, 0])}px)`,
          }}
        >
          Y así toda la semana.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * El barrido de color.
 *
 * Una banda de terracota sube, tapa la pantalla y sigue de largo. Debajo ya
 * esta la plataforma, asi que el color no solo cambia de escena: parece que lo
 * hubiera traido el barrido.
 */
function Barrido() {
  const cuadro = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const avance = interpolate(cuadro, [0, durationInFrames], [0, 2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // De 0 a 1 sube tapando; de 1 a 2 sigue subiendo y destapa.
  const arriba = avance <= 1 ? interpolate(avance, [0, 1], [100, 0]) : 0;
  const abajo = avance <= 1 ? 0 : interpolate(avance, [1, 2], [0, -100]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLOR.terracota,
          transform: `translateY(${arriba + abajo}%)`,
        }}
      />
    </AbsoluteFill>
  );
}

export function VideoAntesYDespues() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      <Sequence durationInFrames={DURACION_ACTO1}>
        <Conversacion />
      </Sequence>

      {ESCENAS.map((escena, i) => (
        <Sequence
          key={escena.captura}
          from={COMIENZO_ACTO2 + DURACION_ESCENA * i}
          durationInFrames={DURACION_ESCENA + 15}
        >
          <Escena {...escena} lado={i % 2 === 0 ? 1 : -1} capitulo="Así se busca aquí" />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_ANTES - COMIENZO_CIERRE}>
        <Cierre remate="Sin preguntarle a *nadie.*" tamanoLogo={180} />
      </Sequence>

      {/* El barrido va encima de todo: es el que hace el cambio. */}
      <Sequence from={COMIENZO_BARRIDO} durationInFrames={DURACION_BARRIDO}>
        <Barrido />
      </Sequence>

      <Avance total={DURACION_ANTES} />
    </AbsoluteFill>
  );
}
