import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MarcoCelular, MarcoComputador } from './Marcos';
import { COLOR, LETRA } from './marca';

/*
  Una escena: un aparato con una captura adentro, un rotulo abajo y un
  movimiento.

  Es generica a proposito. Para cambiar el video no hay que tocar este archivo:
  se cambia la lista de capitulos en VideoCompleto.tsx.

  COMO SE ACOMODA EN EL CUADRO. El aparato y el rotulo son un solo bloque
  centrado, no dos cosas sueltas. Antes el rotulo iba pegado al pie y el
  aparato al centro, y como el portatil es bajito y el celular altisimo, cada
  escena repartia el aire de una forma distinta: en unas quedaba un vacio
  enorme arriba y en otras el texto casi tocaba el telefono. Como bloque unico,
  el aire de arriba y el de abajo salen iguales en todas.

  DE DONDE SALE LA SENSACION DE QUE ESTA BIEN HECHO:

  1. Los aparatos se encadenan: uno sale por la izquierda mientras el otro
     entra por la derecha, y alternan lado.
  2. Ya acomodado, el aparato no se queda quieto: flota. La sombra del piso se
     abre y se cierra con el, que es lo que hace creer que hay un objeto y no
     un dibujo.
  3. La pantalla de adentro se desplaza de verdad, no se agranda.
  4. El rotulo aparece por detras de un borde, como en un titular de cine, y
     entra desenfocado hasta acomodarse.
*/

export type Movimiento = 'bajar' | 'subir' | 'quieto' | 'acercar';

export interface DatosEscena {
  captura: string;
  dispositivo: 'celular' | 'computador';
  /** Una linea por renglon. Partirlas a mano es lo que hace que se lean bien. */
  rotulo: string[];
  movimiento: Movimiento;
  /**
   * Donde empieza y termina el recorrido, como fraccion del alto de la PAGINA.
   * Con capturas de pagina completa, [0, 0.5] baja media pagina.
   */
  desde?: number;
  hasta?: number;
  /**
   * Cuanto se amplia la pagina dentro del aparato. El portatil cabe entero
   * pero entero no se lee, asi que sus escenas van entre 1,25 y 1,6.
   */
  ampliar?: number;
  /** Que punto horizontal de la pagina queda al centro, de 0 a 1. */
  centroX?: number;
}

interface PropsEscena extends DatosEscena {
  /** Por que lado entra: 1 por la derecha, -1 por la izquierda. */
  lado: 1 | -1;
  /** El capitulo al que pertenece, que sale como etiqueta sobre el rotulo. */
  capitulo: string;
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
  capitulo,
}: PropsEscena) {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const avance = cuadro / durationInFrames;
  const CRUCE = 15; // cuadros que dura la entrada y tambien la salida

  // Entrada: llega desplazado y girado, y se acomoda. Un objeto que se acomoda
  // se lee como solido; uno que solo aparece, como una calcomania.
  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 120 } });

  // Salida: se va por el lado contrario al que entro, mientras la escena
  // siguiente ya viene entrando.
  const salida = interpolate(cuadro, [durationInFrames - CRUCE, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Flotacion: una vuelta cada tres segundos y medio, seis pixeles. Es
  // demasiado poco para verlo y suficiente para que la escena no se congele.
  const flotar = Math.sin(cuadro / 17) * 6;
  const balanceo = Math.sin(cuadro / 29) * 1.1;

  const correr = interpolate(entrada, [0, 1], [560 * lado, 0]) - salida * 560 * lado;
  const giro = interpolate(entrada, [0, 1], [18 * lado, 0]) - salida * 18 * lado + balanceo;
  // Al irse tambien se aleja un poco. Un objeto que solo se desliza se lee
  // plano; uno que ademas encoge se lee yendose hacia el fondo.
  const escala = interpolate(entrada, [0, 1], [0.92, 1]) - salida * 0.08;
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

  const anchoAparato = dispositivo === 'celular' ? 540 : 960;

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 90,
        perspective: 1800,
      }}
    >
      <div style={{ width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            opacity: opacidad,
            transform: `translateX(${correr}px) translateY(${flotar}px) rotateY(${giro}deg) scale(${escala})`,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {dispositivo === 'celular' ? (
            <MarcoCelular
              captura={captura}
              ancho={anchoAparato}
              recorrido={recorrido}
              ampliar={ampliar * aumento}
              centroX={centroX}
            />
          ) : (
            <MarcoComputador
              captura={captura}
              ancho={anchoAparato}
              recorrido={recorrido}
              ampliar={ampliar * aumento}
              centroX={centroX}
            />
          )}

          {/* La sombra del piso. Se abre cuando el aparato baja y se cierra
              cuando sube: sin eso, flotar se ve como que la imagen tiembla. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -46,
              width: anchoAparato * (0.78 + flotar / 260),
              height: 26,
              marginLeft: (-anchoAparato * (0.78 + flotar / 260)) / 2,
              borderRadius: '50%',
              background: 'rgba(31,27,23,0.16)',
              filter: 'blur(18px)',
              opacity: 0.9 - flotar / 90,
            }}
          />
        </div>

        <Rotulo lineas={rotulo} capitulo={capitulo} salida={salida} />
      </div>
    </AbsoluteFill>
  );
}

/**
 * El rotulo de la escena.
 *
 * El texto va sobre el fondo de la marca, sin recuadro encima: un recuadro
 * negro tapa el diseno en vez de formar parte de el, y es lo que hace que un
 * video se vea de plantilla.
 *
 * Arriba, en naranja, el capitulo al que pertenece la pantalla. Ese es el
 * unico naranja que queda en esta parte del video, y es a proposito: el naranja
 * dejo de resaltar palabras -- resaltar de a una palabra en cada rotulo
 * terminaba marcando cosas que no lo merecian -- y quedo como senal de en que
 * parte va uno.
 *
 * Cada renglon entra desenfocado por detras de un borde invisible. Es el
 * titular de una pelicula, y son cuatro lineas de codigo: una caja que
 * recorta, el texto subiendo dentro de ella y un desenfoque que se va.
 */
function Rotulo({
  lineas,
  capitulo,
  salida,
}: {
  lineas: string[];
  capitulo: string;
  salida: number;
}) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barra = spring({
    frame: cuadro - Math.round(fps * 0.16),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <div style={{ width: '100%', marginTop: 56, opacity: 1 - salida }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
        <div style={{ height: 8, width: 110 * barra, borderRadius: 999, background: COLOR.terracota }} />
        <span
          style={{
            fontSize: 29,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: COLOR.terracota,
            opacity: barra,
          }}
        >
          {capitulo}
        </span>
      </div>

      {lineas.map((linea, i) => {
        const entrada = spring({
          frame: cuadro - Math.round(fps * 0.24) - i * 6,
          fps,
          config: { damping: 200, stiffness: 100 },
        });

        return (
          <div key={linea} style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <p
              style={{
                margin: 0,
                fontSize: 60,
                fontWeight: 800,
                lineHeight: 1.16,
                letterSpacing: -2,
                color: COLOR.piedra,
                transform: `translateY(${interpolate(entrada, [0, 1], [110, 0])}%)`,
                filter: `blur(${interpolate(entrada, [0, 1], [10, 0])}px)`,
              }}
            >
              {linea}
            </p>
          </div>
        );
      })}
    </div>
  );
}
