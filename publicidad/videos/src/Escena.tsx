import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MarcoCelular, MarcoComputador } from './Marcos';
import { COLOR, LETRA } from './marca';

/*
  Una escena: un aparato con una captura adentro, un rotulo abajo y un
  movimiento.

  Es generica a proposito. Para cambiar el video no hay que tocar este archivo:
  se cambia la lista de escenas en VideoCompleto.tsx.

  DE DONDE SALE LA SENSACION DE QUE ESTA BIEN HECHO. No es una sola cosa, son
  cuatro pequenas al tiempo:

  1. Los aparatos se encadenan: uno sale por la izquierda mientras el otro
     entra por la derecha, y alternan lado. Es el mismo recurso de un comercial
     de television: nunca hay un momento en que la pantalla este quieta.
  2. La pantalla de adentro se desplaza de verdad, no se agranda.
  3. El rotulo aparece por detras de un borde, como en un titular de cine. Sin
     recuadro negro encima: el texto va sobre el fondo de la marca.
  4. Cada escena arranca antes de que termine la anterior.
*/

export type Movimiento = 'bajar' | 'subir' | 'quieto' | 'acercar';

export interface DatosEscena {
  captura: string;
  dispositivo: 'celular' | 'computador';
  /** Una linea por renglon. Partirlas a mano es lo que hace que se lean bien. */
  rotulo: string[];
  movimiento: Movimiento;
  /**
   * Donde empieza y termina el recorrido, como fraccion del alto de la imagen.
   * Con capturas de pagina completa, [0, 0.5] baja media pagina.
   */
  desde?: number;
  hasta?: number;
  /**
   * Cuanto se amplia la pagina dentro del aparato. El portatil cabe entero
   * pero entero no se lee, asi que sus escenas van entre 1,4 y 1,7.
   */
  ampliar?: number;
  /** Que punto horizontal de la pagina queda al centro, de 0 a 1. */
  centroX?: number;
}

interface PropsEscena extends DatosEscena {
  /** Por que lado entra: 1 por la derecha, -1 por la izquierda. */
  lado: 1 | -1;
  indice: number;
  total: number;
}

export function Escena({
  captura,
  dispositivo,
  rotulo,
  movimiento,
  desde = 0,
  hasta = 0.3,
  ampliar = 1,
  centroX = 0.5,
  lado,
  indice,
  total,
}: PropsEscena) {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const avance = cuadro / durationInFrames;
  const CRUCE = 14; // cuadros que dura la entrada y tambien la salida

  // Entrada: llega desplazado y girado, y se acomoda. Un objeto que se acomoda
  // se lee como solido; uno que solo aparece, como una calcomania.
  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 130 } });

  // Salida: se va por el lado contrario al que entro, mientras la escena
  // siguiente ya viene entrando.
  const salida = interpolate(cuadro, [durationInFrames - CRUCE, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const correr = interpolate(entrada, [0, 1], [520 * lado, 0]) - salida * 520 * lado;
  const giro = interpolate(entrada, [0, 1], [16 * lado, 0]) - salida * 16 * lado;
  const opacidad = Math.min(entrada * 1.4, 1) * (1 - salida);

  const recorrido = (() => {
    switch (movimiento) {
      case 'bajar':
        return interpolate(avance, [0, 1], [desde, hasta]);
      case 'subir':
        return interpolate(avance, [0, 1], [hasta, desde]);
      case 'quieto':
      case 'acercar':
        return desde;
    }
  })();

  // El acercamiento es minimo: 8% en toda la escena. Lo justo para que la
  // imagen no parezca congelada, sin que se note el emborronado.
  const aumento = movimiento === 'acercar' ? interpolate(avance, [0, 1], [1, 1.08]) : 1;

  return (
    <AbsoluteFill style={{ fontFamily: LETRA }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: dispositivo === 'celular' ? 340 : 300,
          perspective: 1800,
        }}
      >
        <div
          style={{
            opacity: opacidad,
            transform: `translateX(${correr}px) rotateY(${giro}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {dispositivo === 'celular' ? (
            <MarcoCelular
              captura={captura}
              ancho={540}
              recorrido={recorrido}
              ampliar={ampliar * aumento}
              centroX={centroX}
            />
          ) : (
            <MarcoComputador
              captura={captura}
              ancho={960}
              recorrido={recorrido}
              ampliar={ampliar * aumento}
              centroX={centroX}
            />
          )}
        </div>
      </AbsoluteFill>

      <Rotulo lineas={rotulo} indice={indice} total={total} salida={salida} />
    </AbsoluteFill>
  );
}

/**
 * El rotulo de la escena.
 *
 * Antes era un recuadro negro con el texto encima. Un recuadro asi es lo que
 * hace que un video se vea de plantilla: tapa el diseno en vez de formar parte
 * de el. Ahora el texto va sobre el fondo de la marca, con una barra de color
 * que se estira y el numero de la funcion al lado.
 *
 * Cada renglon entra por debajo de un borde invisible, como el titular de una
 * pelicula. Es el mismo efecto que se ve caro y son cuatro lineas de codigo:
 * una caja que recorta y el texto subiendo dentro de ella.
 */
function Rotulo({
  lineas,
  indice,
  total,
  salida,
}: {
  lineas: string[];
  indice: number;
  total: number;
  salida: number;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barra = spring({
    frame: cuadro - Math.round(fps * 0.18),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  const dosDigitos = (n: number) => String(n).padStart(2, '0');

  return (
    <AbsoluteFill
      style={{ justifyContent: 'flex-end', padding: '0 90px 200px', opacity: 1 - salida }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 26 }}>
        <div
          style={{
            height: 8,
            width: 120 * barra,
            borderRadius: 999,
            background: COLOR.terracota,
          }}
        />
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            color: COLOR.terracota,
            opacity: barra,
          }}
        >
          {dosDigitos(indice + 1)} / {dosDigitos(total)}
        </span>
      </div>

      {lineas.map((linea, i) => {
        const entrada = spring({
          frame: cuadro - Math.round(fps * 0.24) - i * 5,
          fps,
          config: { damping: 200, stiffness: 110 },
        });

        return (
          <div key={linea} style={{ overflow: 'hidden', paddingBottom: 6 }}>
            <p
              style={{
                margin: 0,
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.14,
                letterSpacing: -2,
                color: i === 0 ? COLOR.piedra : COLOR.terracota,
                transform: `translateY(${interpolate(entrada, [0, 1], [110, 0])}%)`,
              }}
            >
              {linea}
            </p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
