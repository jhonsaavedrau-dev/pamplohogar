import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MarcoCelular, MarcoComputador } from './Marcos';
import { COLOR, LETRA } from './marca';

/*
  Una escena: un dispositivo con una captura adentro, un rotulo abajo y un
  movimiento.

  Es generica a proposito. Para cambiar el video no hay que tocar este archivo:
  se cambia la lista de escenas en VideoCompleto.tsx.

  DE DONDE SALE LA SENSACION DE QUE ESTA BIEN HECHO. No es una sola cosa, son
  cuatro pequenas al tiempo:

  1. El dispositivo entra girado en el espacio y se endereza. Un objeto que se
     acomoda se lee como solido; uno que solo aparece, como una calcomania.
  2. La pantalla de adentro se desplaza de verdad, no se agranda.
  3. El rotulo llega despues que la imagen: primero se ve, despues se lee.
  4. Al final la escena se va con un desvanecido, encimandose con la
     siguiente. Cortar en seco entre dos pantallas quietas se siente brusco.
*/

export type Movimiento = 'bajar' | 'subir' | 'quieto' | 'acercar';

export interface DatosEscena {
  captura: string;
  dispositivo: 'celular' | 'computador';
  rotulo: string;
  movimiento: Movimiento;
  /**
   * Donde empieza y termina el recorrido, como fraccion del alto de la imagen.
   * Con capturas de pagina completa, [0, 0.5] baja media pagina.
   */
  desde?: number;
  hasta?: number;
  /** Resalta un punto de la pantalla con un halo. Para la funcion estrella. */
  senalar?: { x: number; y: number };
}

export function Escena({
  captura,
  dispositivo,
  rotulo,
  movimiento,
  desde = 0,
  hasta = 0.3,
  senalar,
}: DatosEscena) {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const avance = cuadro / durationInFrames;

  // Entrada: el aparato llega girado y se endereza con un rebote corto.
  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 70 } });
  const giro = interpolate(entrada, [0, 1], [dispositivo === 'celular' ? 14 : -12, 0]);
  const alzada = interpolate(entrada, [0, 1], [70, 0]);

  // Salida: los ultimos 12 cuadros se desvanece, para encimarse con la
  // escena siguiente en vez de cortar en seco.
  const salida = interpolate(cuadro, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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

  // El acercamiento es minimo: 6% en toda la escena. Lo justo para que la
  // imagen no parezca congelada, sin que se note el emborronado.
  const acercamiento = movimiento === 'acercar' ? interpolate(avance, [0, 1], [1, 1.06]) : 1;

  const entradaRotulo = spring({
    frame: cuadro - Math.round(fps * 0.4),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, opacity: salida }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 190,
          perspective: 1800,
        }}
      >
        <div
          style={{
            opacity: entrada,
            transform: `translateY(${alzada}px) rotateY(${giro}deg) rotateX(${giro * 0.25}deg)`,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {dispositivo === 'celular' ? (
            <MarcoCelular captura={captura} ancho={600} recorrido={recorrido} acercamiento={acercamiento} />
          ) : (
            <MarcoComputador captura={captura} ancho={980} recorrido={recorrido} acercamiento={acercamiento} />
          )}

          {senalar && <Halo x={senalar.x} y={senalar.y} />}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 250 }}>
        <div
          style={{
            margin: '0 60px',
            background: 'rgba(31,27,23,0.92)',
            borderRadius: 28,
            padding: '32px 42px',
            opacity: entradaRotulo,
            transform: `translateY(${interpolate(entradaRotulo, [0, 1], [34, 0])}px)`,
            boxShadow: '0 20px 40px -18px rgba(31,27,23,0.6)',
          }}
        >
          <p style={{ margin: 0, fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {rotulo}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * Un halo que late sobre un punto de la pantalla.
 *
 * Se usa una sola vez en todo el video, sobre la regla de precios. Un recurso
 * que se repite deja de senalar: si todo esta resaltado, nada lo esta.
 */
function Halo({ x, y }: { x: number; y: number }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const aparece = spring({
    frame: cuadro - Math.round(fps * 0.8),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  // Late despacio, dos veces por segundo seria un semaforo.
  const latido = 1 + Math.sin(cuadro / 9) * 0.06;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: 240,
        height: 240,
        marginLeft: -120,
        marginTop: -120,
        borderRadius: '50%',
        border: `5px solid ${COLOR.terracotaClaro}`,
        boxShadow: `0 0 0 12px rgba(210,105,30,0.16)`,
        opacity: aparece * 0.9,
        transform: `scale(${aparece * latido})`,
      }}
    />
  );
}
