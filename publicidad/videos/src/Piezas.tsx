import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Logo } from './Logo';
import { color, trozos } from './Texto';
import { COLOR, LETRA } from './marca';

/*
  Las piezas sueltas que comparten los tres videos: las frases del comienzo, el
  sello del logo, la marca del encabezado, la barra de avance y el cierre.

  Estan aparte porque tres videos las usan igual. Copiadas en los tres, arreglar
  el desenfoque de las palabras seria arreglarlo tres veces y acordarse de las
  tres, que es como se termina con un video bueno y dos viejos.

  Todas reciben su duracion en vez de sacarla de una constante: la misma frase
  dura 2,9 segundos en el video largo y 3,2 en el corto, porque en el corto no
  hay una segunda oportunidad de leerla.
*/

/**
 * Una frase, palabra por palabra.
 *
 * Cada palabra entra desenfocada, sube y se enfoca. El desenfoque es lo que
 * separa un texto que aparece de un texto que ENTRA: el ojo lo lee como algo
 * que se acerca desde el fondo, y es el mismo recurso de los titulos de cine.
 *
 * La palabra entre asteriscos sale en naranja.
 */
export function Frase({
  texto,
  duracion,
  tamano = 86,
  cadencia = 2.5,
}: {
  texto: string;
  duracion: number;
  tamano?: number;
  /** Cuadros entre una palabra y la siguiente. Menos es mas rapido. */
  cadencia?: number;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const salida = interpolate(cuadro, [duracion - 9, duracion], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const acercar = interpolate(cuadro, [0, duracion], [1, 1.04]);
  const subir = interpolate(cuadro, [0, duracion], [0, -20]);

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        padding: '0 90px',
        justifyContent: 'center',
        opacity: salida,
        transform: `scale(${acercar}) translateY(${subir}px)`,
      }}
    >
      <p
        style={{
          fontSize: tamano,
          fontWeight: 800,
          lineHeight: 1.14,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 20px',
        }}
      >
        {trozos(texto).map(({ palabra, fuerte }, i) => {
          const entrada = spring({
            frame: cuadro - i * cadencia,
            fps,
            config: { damping: 200, stiffness: 130 },
          });
          return (
            <span
              key={palabra + i}
              style={{
                color: color(fuerte),
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [30, 0])}px)`,
                filter: `blur(${interpolate(entrada, [0, 1], [12, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {palabra}
            </span>
          );
        })}
      </p>
    </AbsoluteFill>
  );
}

/** El sello: la marca, animada, en la bisagra del video. */
export function Sello({ duracion, tamano = 240 }: { duracion: number; tamano?: number }) {
  const cuadro = useCurrentFrame();

  const salida = interpolate(cuadro, [duracion - 9, duracion], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: LETRA, alignItems: 'center', justifyContent: 'center', opacity: salida }}
    >
      <Logo tamano={tamano} conDireccion />
    </AbsoluteFill>
  );
}

/**
 * La marca arriba, mientras se muestran las pantallas.
 *
 * Un comercial nunca esconde de quien es. Va pequena y quieta: si se moviera
 * competiria con lo unico que tiene que mirarse, que es la pantalla.
 */
export function Marca() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 80 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 64,
        opacity: entrada * 0.85,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Img src={staticFile('marca-icono.png')} style={{ width: 56, height: 56 }} />
        <span style={{ fontSize: 34, fontWeight: 700, color: COLOR.piedraGris, letterSpacing: -0.5 }}>
          pamplohogar.com
        </span>
      </div>
    </AbsoluteFill>
  );
}

/**
 * La barra de avance del pie.
 *
 * Dice cuanto falta sin decirlo. En un video vertical la gente desliza cuando
 * no sabe si esto va para largo; ver la barra a media asta es motivo para
 * quedarse.
 */
export function Avance({ total }: { total: number }) {
  const cuadro = useCurrentFrame();

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ height: 7, background: 'rgba(31,27,23,0.10)' }}>
        <div
          style={{ height: '100%', width: `${(cuadro / total) * 100}%`, background: COLOR.terracota }}
        />
      </div>
    </AbsoluteFill>
  );
}

/**
 * El cierre.
 *
 * El codigo QR solo va en el video largo. En uno de quince segundos nadie saca
 * el otro telefono a escanear: alcanza para leer una direccion y ya, y meter el
 * codigo solo le quita tamano al nombre.
 */
export function Cierre({
  conCodigo = false,
  remate,
  tamanoLogo = 190,
}: {
  conCodigo?: boolean;
  /** La frase de abajo. Sin ella el cierre queda solo con la direccion. */
  remate?: string;
  tamanoLogo?: number;
}) {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  /*
    Los tiempos se ajustan a lo que dure el cierre.

    En el video largo el cierre dura cinco segundos y medio y las tres cosas
    entran con calma. En los cortos dura dos, y con los mismos tiempos la
    direccion se quedaba a medio descubrir cuando el video ya se habia
    acabado: se leia "pamplohogar.co". El tope de arriba manda mientras haya
    tiempo, y por debajo manda la fraccion.
  */
  const corto = durationInFrames < fps * 3;
  const cuando = (segundos: number, fraccion: number) =>
    Math.round(Math.min(fps * segundos, durationInFrames * fraccion));

  const direccion = spring({
    frame: cuadro - cuando(0.55, 0.22),
    fps,
    config: { damping: 200, stiffness: corto ? 150 : 90 },
  });
  const codigo = spring({
    frame: cuadro - cuando(0.9, 0.4),
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const finalizacion = spring({
    frame: cuadro - cuando(conCodigo ? 1.35 : 0.85, 0.52),
    fps,
    config: { damping: 200, stiffness: corto ? 140 : 90 },
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Logo tamano={tamanoLogo} />

      <p
        style={{
          margin: '38px 0 0',
          fontSize: 68,
          fontWeight: 800,
          letterSpacing: -2,
          color: COLOR.terracota,
          clipPath: `inset(0 ${(1 - direccion) * 100}% 0 0)`,
        }}
      >
        pamplohogar.com
      </p>

      {conCodigo && (
        <div
          style={{
            opacity: codigo,
            marginTop: 42,
            transform: `scale(${interpolate(codigo, [0, 1], [0.85, 1])})`,
            background: '#fff',
            padding: 18,
            borderRadius: 26,
            boxShadow: '0 24px 50px -20px rgba(31,27,23,0.35)',
          }}
        >
          <Img src={staticFile('qr-pamplohogar.png')} style={{ width: 240, height: 240 }} />
        </div>
      )}

      {remate && (
        <p
          style={{
            margin: '38px 0 0',
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: -1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0 12px',
            opacity: finalizacion,
            transform: `translateY(${interpolate(finalizacion, [0, 1], [22, 0])}px)`,
          }}
        >
          {trozos(remate).map(({ palabra, fuerte }, i) => (
            <span key={palabra + i} style={{ color: color(fuerte) }}>
              {palabra}
            </span>
          ))}
        </p>
      )}
    </AbsoluteFill>
  );
}
