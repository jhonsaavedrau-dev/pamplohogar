import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, trozos } from './Texto';
import { COLOR, LETRA } from './marca';

/*
  El sistema de titulos que usan los quince videos.

  Antes cada video escribia sus parrafos a mano, y por eso ninguno tenia el
  mismo tamano ni la misma separacion que el de al lado: uno ponia el titular
  en 72, el otro en 64, el remate de uno entraba desde abajo y el del otro se
  desvanecia. Sumados, se veian hechos por quince personas distintas.

  Aqui hay tres piezas y nada mas: el ANTETITULO -- la barrita con la etiqueta
  --, el TITULAR y el PIE. Con esas tres se arma cualquiera de los videos, y
  todos respiran igual.

  LA ZONA SEGURA es la otra mitad del asunto. Instagram le monta al video su
  propia botonera: arriba la foto de perfil y la equis, abajo la barra de
  escribir, y TikTok le pone los botones a la derecha y el texto abajo. Un
  titular pegado al borde queda tapado por esa botonera, y eso no se ve al
  renderizar sino cuando ya esta publicado. Por eso nada se pone a menos de 200
  del techo ni de 300 del piso.
*/

export const ZONA = {
  /** Lo que tapa la botonera de arriba de Instagram. */
  arriba: 200,
  /** Lo que tapan la barra de escribir y los botones de TikTok. */
  abajo: 300,
  lados: 90,
};

/**
 * La barrita con la etiqueta.
 *
 * La barra se estira en vez de aparecer: un trazo que crece se lee como algo
 * que se esta escribiendo, y da medio segundo de anticipacion antes de que
 * llegue el titular.
 */
export function Antetitulo({
  texto,
  retraso = 0,
  oscuro = false,
}: {
  texto: string;
  retraso?: number;
  oscuro?: boolean;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({
    frame: cuadro - retraso,
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const tinte = oscuro ? COLOR.terracotaClaro : COLOR.terracota;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 26 }}>
      <div style={{ height: 8, width: 110 * entrada, borderRadius: 999, background: tinte }} />
      <span
        style={{
          fontFamily: LETRA,
          fontSize: 29,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: tinte,
          opacity: entrada,
        }}
      >
        {texto}
      </span>
    </div>
  );
}

/**
 * El titular.
 *
 * Una linea por renglon, partidas a mano. Cada una entra desenfocada por
 * detras de un borde invisible, como el titulo de una pelicula: la caja
 * recorta, el texto sube dentro de ella y el desenfoque se va.
 *
 * La palabra entre asteriscos sale en naranja.
 */
export function Titular({
  lineas,
  tamano = 72,
  retraso = 0,
  oscuro = false,
}: {
  lineas: string[];
  tamano?: number;
  retraso?: number;
  oscuro?: boolean;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div>
      {lineas.map((linea, i) => {
        const entrada = spring({
          frame: cuadro - retraso - i * 6,
          fps,
          config: { damping: 200, stiffness: 100 },
        });
        return (
          <div key={linea} style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <p
              style={{
                margin: 0,
                fontFamily: LETRA,
                fontSize: tamano,
                fontWeight: 800,
                lineHeight: 1.14,
                letterSpacing: -2,
                transform: `translateY(${interpolate(entrada, [0, 1], [110, 0])}%)`,
                filter: `blur(${interpolate(entrada, [0, 1], [11, 0])}px)`,
              }}
            >
              {trozos(linea).map(({ palabra, fuerte }, j) => (
                <span key={palabra + j} style={{ color: color(fuerte, oscuro) }}>
                  {palabra}{' '}
                </span>
              ))}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * El pie: la linea de apoyo, mas pequena y en gris.
 *
 * Va debajo del titular y nunca del mismo tamano. Dos textos del mismo peso
 * pegados uno encima del otro compiten, y el ojo no sabe cual leer primero.
 */
export function Pie({
  texto,
  retraso = 0,
  oscuro = false,
  tamano = 40,
}: {
  texto: string;
  retraso?: number;
  oscuro?: boolean;
  tamano?: number;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({
    frame: cuadro - retraso,
    fps,
    config: { damping: 200, stiffness: 95 },
  });

  return (
    <p
      style={{
        margin: '18px 0 0',
        fontFamily: LETRA,
        fontSize: tamano,
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: -0.5,
        color: oscuro ? 'rgba(251,243,236,0.72)' : COLOR.piedraSuave,
        opacity: entrada,
        transform: `translateY(${interpolate(entrada, [0, 1], [20, 0])}px)`,
      }}
    >
      {texto}
    </p>
  );
}
