import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  El video de PamploHogar: 42 segundos, sin grabar nada.

    0 - 9 s    El problema, en tres frases. Palabra por palabra.
    9 - 13 s   El giro.
    13 - 36 s  La plataforma: seis pantallas con marco de dispositivo.
    36 - 42 s  El cierre con el codigo.

  Los primeros nueve segundos van casi quietos a proposito. Sin gente ni
  camara, lo unico que da energia es el contraste: si todo se mueve desde el
  principio, nada se mueve.

  Para cambiar el video se tocan las dos listas de abajo.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const PROBLEMA = [
  ['En Pamplona, conseguir dónde vivir', 'depende de a quién conozcas.'],
  ['Grupos de WhatsApp. Avisos en un poste.', 'Conocidos de conocidos.'],
  ['Y el precio,', 'solo si preguntas.'],
];

/*
  Las seis pantallas.

  El orden no es casual: primero lo que se ve de una, despues lo que hay que
  abrir, y al final lo que no tiene nadie mas.

  Se alternan celular y computador: el cambio de forma, una alta y una ancha,
  refresca la vista sin que uno se de cuenta.

  Los recorridos van sobre capturas de pagina completa. El listado del celular
  mide diez pantallas, asi que bajar hasta 0,2 ya recorre dos pantallas largas.
*/
const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/1-portada.png',
    dispositivo: 'celular',
    rotulo: 'Todos los arriendos, en un solo sitio',
    movimiento: 'acercar',
  },
  {
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: 'El precio, sin preguntar',
    movimiento: 'bajar',
    desde: 0.04,
    hasta: 0.2,
  },
  {
    captura: 'capturas/computador/2-listado-largo.png',
    dispositivo: 'computador',
    rotulo: 'Y a cuántos minutos queda de la U',
    movimiento: 'bajar',
    desde: 0.1,
    hasta: 0.34,
  },
  {
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: 'Si te cobran de más, te lo dice',
    movimiento: 'bajar',
    desde: 0.32,
    hasta: 0.44,
    senalar: { x: 26, y: 51 },
  },
  {
    captura: 'capturas/computador/5-mapa-precios.png',
    dispositivo: 'computador',
    rotulo: 'Dónde se cobra más y dónde menos',
    movimiento: 'acercar',
  },
  {
    captura: 'capturas/celular/7-roomies-largo.png',
    dispositivo: 'celular',
    rotulo: 'Y con quién compartir',
    movimiento: 'bajar',
    desde: 0.06,
    hasta: 0.34,
  },
];

/**
 * Una frase del problema, palabra por palabra.
 *
 * Aparecer de golpe se lee como una diapositiva. Palabra por palabra obliga a
 * leer al ritmo que uno quiere, que es el mismo truco de un buen subtitulo.
 */
function Frase({ texto, resaltado }: { texto: string; resaltado: string }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const palabras = [
    ...texto.split(' ').map((p) => ({ p, fuerte: false })),
    ...resaltado.split(' ').map((p) => ({ p, fuerte: true })),
  ];

  const salida = interpolate(cuadro, [s(3) - 10, s(3)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: LETRA, padding: '0 100px', justifyContent: 'center', opacity: salida }}
    >
      <p
        style={{
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 20px',
        }}
      >
        {palabras.map(({ p, fuerte }, i) => {
          const entrada = spring({
            frame: cuadro - i * 2.5,
            fps,
            config: { damping: 200, stiffness: 120 },
          });
          return (
            <span
              key={p + i}
              style={{
                color: fuerte ? COLOR.terracota : COLOR.piedra,
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [26, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {p}
            </span>
          );
        })}
      </p>
    </AbsoluteFill>
  );
}

/** El giro: la pregunta que abre la segunda mitad. */
function Giro() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 60 } });
  const acercar = interpolate(cuadro, [0, s(4)], [1.04, 1]);
  const salida = interpolate(cuadro, [s(4) - 12, s(4)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        padding: '0 100px',
        justifyContent: 'center',
        opacity: entrada * salida,
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

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 70 } });
  const entradaCodigo = spring({
    frame: cuadro - Math.round(fps * 0.6),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          opacity: entrada,
          transform: `translateY(${interpolate(entrada, [0, 1], [44, 0])}px) scale(${interpolate(
            entrada,
            [0, 1],
            [0.92, 1],
          )})`,
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

      <div
        style={{
          opacity: entradaCodigo,
          marginTop: 60,
          transform: `scale(${interpolate(entradaCodigo, [0, 1], [0.85, 1])})`,
          background: '#fff',
          padding: 18,
          borderRadius: 26,
          boxShadow: '0 24px 50px -20px rgba(31,27,23,0.35)',
        }}
      >
        <Img src={staticFile('qr-pamplohogar.png')} style={{ width: 260, height: 260 }} />
      </div>
    </AbsoluteFill>
  );
}

export function VideoCompleto() {
  const duracionEscena = s(3.8);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      {PROBLEMA.map(([texto, resaltado], i) => (
        <Sequence key={texto} from={s(3) * i} durationInFrames={s(3)}>
          <Frase texto={texto} resaltado={resaltado} />
        </Sequence>
      ))}

      <Sequence from={s(9)} durationInFrames={s(4)}>
        <Giro />
      </Sequence>

      {/* Las escenas se encabalgan doce cuadros: mientras una se va, la otra
          ya esta entrando. Sin ese cruce, seis cortes secos seguidos se
          sienten como pasar diapositivas. */}
      {ESCENAS.map((escena, i) => (
        <Sequence
          key={escena.captura}
          from={s(13) + duracionEscena * i}
          durationInFrames={duracionEscena + 12}
        >
          <Escena {...escena} />
        </Sequence>
      ))}

      <Sequence from={s(13) + duracionEscena * ESCENAS.length} durationInFrames={s(6)}>
        <Cierre />
      </Sequence>
    </AbsoluteFill>
  );
}
