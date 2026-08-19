import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  El video completo de PamploHogar: 40 segundos, sin grabar nada.

  Estructura:

    0 - 9 s    El problema, en tres frases. Todo quieto.
    9 - 13 s   El giro: y si estuvieran todos en un solo sitio.
    13 - 34 s  La plataforma, seis pantallas con marco de dispositivo.
    34 - 40 s  El cierre con el codigo.

  Los primeros nueve segundos van QUIETOS a proposito. Sin gente ni camara, lo
  unico que da energia es el contraste: si todo se mueve desde el principio,
  nada se mueve. La quietud del problema hace que la plataforma se sienta como
  un alivio.

  Para cambiar el video se tocan las dos listas de abajo. No hace falta entrar
  a Escena.tsx ni a Marcos.tsx.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

/** Las tres frases del problema. La segunda parte va en terracota. */
const PROBLEMA = [
  ['En Pamplona, conseguir dónde vivir', 'depende de a quién conozcas.'],
  ['Grupos de WhatsApp. Avisos en un poste.', 'Conocidos de conocidos.'],
  ['Y el precio,', 'solo si preguntas.'],
];

/*
  Las seis pantallas.

  El orden no es casual: primero lo que se ve de una (el listado), despues lo
  que hay que abrir (la ficha), y al final lo que nadie mas tiene (la regla de
  precios y el mapa).

  Se alternan celular y computador. El cambio de forma, una alta y una ancha,
  refresca la vista sin que uno se de cuenta.
*/
const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/1-portada.png',
    dispositivo: 'celular',
    rotulo: 'Todos los arriendos, en un solo sitio',
    movimiento: 'acercar',
  },
  {
    captura: 'capturas/celular/2-listado.png',
    dispositivo: 'celular',
    rotulo: 'El precio, sin preguntar',
    movimiento: 'recorrer',
  },
  {
    captura: 'capturas/computador/3-ficha.png',
    dispositivo: 'computador',
    rotulo: 'A cuántos minutos queda de la U',
    movimiento: 'deriva',
  },
  {
    captura: 'capturas/computador/4-ficha-precio.png',
    dispositivo: 'computador',
    rotulo: 'Si te cobran de más, te lo dice',
    movimiento: 'acercar',
  },
  {
    captura: 'capturas/computador/5-mapa-precios.png',
    dispositivo: 'computador',
    rotulo: 'Dónde se cobra más y dónde menos',
    movimiento: 'acercar',
  },
  {
    captura: 'capturas/celular/7-roomies.png',
    dispositivo: 'celular',
    rotulo: 'Y con quién compartir',
    movimiento: 'recorrer',
  },
];

/** Una frase del problema, sobre el crema. Sin movimiento, a proposito. */
function Frase({ texto, resaltado }: { texto: string; resaltado: string }) {
  const cuadro = useCurrentFrame();

  // Solo aparece y desaparece. Es lo unico que se mueve en estos nueve
  // segundos, y es lo que hace que los cortes se sientan secos.
  const opacidad = interpolate(cuadro, [0, 8, s(3) - 8, s(3)], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.crema,
        fontFamily: LETRA,
        padding: '0 100px',
        justifyContent: 'center',
        opacity: opacidad,
      }}
    >
      <p
        style={{
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -2,
          color: COLOR.piedra,
          margin: 0,
        }}
      >
        {texto} <span style={{ color: COLOR.terracota }}>{resaltado}</span>
      </p>
    </AbsoluteFill>
  );
}

/** El giro: la pregunta que abre la segunda mitad. */
function Giro() {
  const cuadro = useCurrentFrame();

  // Aqui si hay un acercamiento lentisimo. Es el punto donde el video cambia
  // de tono, y el movimiento lo anuncia antes de que se lea el texto.
  const acercar = interpolate(cuadro, [0, s(4)], [1, 1.06]);
  const opacidad = interpolate(cuadro, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.crema,
        fontFamily: LETRA,
        padding: '0 100px',
        justifyContent: 'center',
        opacity: opacidad,
        transform: `scale(${acercar})`,
      }}
    >
      <p
        style={{
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -2,
          color: COLOR.piedra,
          margin: 0,
        }}
      >
        ¿Y si todos los arriendos de Pamplona estuvieran en{' '}
        <span style={{ color: COLOR.terracota }}>un solo sitio?</span>
      </p>
    </AbsoluteFill>
  );
}

/** El cierre: logo, direccion y codigo. */
function Cierre() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 80 } });
  const entradaCodigo = spring({
    frame: cuadro - Math.round(fps * 0.5),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.crema,
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity: entrada,
          transform: `translateY(${interpolate(entrada, [0, 1], [40, 0])}px)`,
          textAlign: 'center',
        }}
      >
        <Img src={staticFile('marca-icono.png')} style={{ width: 240, height: 240 }} />
        <p
          style={{
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            color: COLOR.terracota,
            letterSpacing: -2,
          }}
        >
          pamplohogar.com
        </p>
        <p style={{ marginTop: 10, fontSize: 40, color: COLOR.piedraGris }}>
          Arriendos para estudiantes en Pamplona
        </p>
      </div>

      <div style={{ opacity: entradaCodigo, marginTop: 60 }}>
        <Img
          src={staticFile('qr-pamplohogar.png')}
          style={{ width: 280, height: 280, borderRadius: 22 }}
        />
      </div>
    </AbsoluteFill>
  );
}

export function VideoCompleto() {
  const duracionEscena = s(3.5);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      {PROBLEMA.map(([texto, resaltado], i) => (
        <Sequence key={texto} from={s(3) * i} durationInFrames={s(3)}>
          <Frase texto={texto} resaltado={resaltado} />
        </Sequence>
      ))}

      <Sequence from={s(9)} durationInFrames={s(4)}>
        <Giro />
      </Sequence>

      {ESCENAS.map((escena, i) => (
        <Sequence
          key={escena.captura}
          from={s(13) + duracionEscena * i}
          durationInFrames={duracionEscena}
        >
          <Escena {...escena} />
        </Sequence>
      ))}

      <Sequence from={s(34)} durationInFrames={s(6)}>
        <Cierre />
      </Sequence>
    </AbsoluteFill>
  );
}
