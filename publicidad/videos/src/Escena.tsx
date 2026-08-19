import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MarcoCelular, MarcoComputador } from './Marcos';
import { COLOR, LETRA } from './marca';

/*
  Una escena del video: un dispositivo con una captura adentro, un rotulo
  abajo, y un movimiento.

  Es generica a proposito. Para cambiar el video no hay que tocar este archivo:
  se cambia la lista de escenas en VideoCompleto.tsx. Cambiar una captura, un
  texto o un movimiento es cambiar una palabra.
*/

/**
 * Los movimientos disponibles.
 *
 * Ninguno es un efecto por el efecto: cada uno imita algo que hace una persona
 * mirando una pantalla.
 *
 * - acercar:  se inclina a mirar de cerca
 * - alejar:   se echa para atras y ve el conjunto
 * - recorrer: baja por la pagina
 * - deriva:   la mirada se pasea sin prisa
 */
export type Movimiento = 'acercar' | 'alejar' | 'recorrer' | 'deriva';

function movimientoDe(
  cual: Movimiento,
  avance: number,
  fuerte: boolean,
): React.CSSProperties {
  /*
    En computador el movimiento va mas fuerte.

    Una captura de computador entra en el marco a menos de la mitad de su
    tamano, asi que las letras quedan diminutas. Acercarse mas no es un capricho
    visual: es lo unico que hace que se lea lo que dice la pantalla.
  */
  const f = fuerte ? 1 : 0.6;

  // El anclaje arriba deja quieto el encabezado con el logo. Si se ancla al
  // centro, al acercarse se le come la marca por arriba.
  const origen = 'top center';

  switch (cual) {
    case 'acercar':
      return {
        transformOrigin: origen,
        transform: `scale(${interpolate(avance, [0, 1], [1, 1 + 0.28 * f])})`,
      };
    case 'alejar':
      return {
        transformOrigin: origen,
        transform: `scale(${interpolate(avance, [0, 1], [1 + 0.28 * f, 1.02])})`,
      };
    case 'recorrer':
      // La imagen va mas grande que la ventana, asi el recorrido no deja
      // huecos por arriba ni por abajo.
      return {
        transformOrigin: 'center center',
        transform: `scale(1.3) translateY(${interpolate(avance, [0, 1], [8, -8])}%)`,
      };
    case 'deriva':
      return {
        transformOrigin: origen,
        transform: `scale(${1 + 0.12 * f}) translateX(${interpolate(avance, [0, 1], [-2.5, 2.5])}%)`,
      };
  }
}

export interface DatosEscena {
  captura: string;
  dispositivo: 'celular' | 'computador';
  rotulo: string;
  movimiento: Movimiento;
}

export function Escena({ captura, dispositivo, rotulo, movimiento }: DatosEscena) {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Cuanto ha avanzado la escena, de 0 a 1. Todo el movimiento cuelga de aqui,
  // asi que dura exactamente lo que dura la escena, sin cuentas aparte.
  const avance = cuadro / durationInFrames;

  // El dispositivo entra desde abajo con un rebote corto.
  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 80 } });

  // El rotulo llega un poco despues: primero se ve la pantalla, despues se lee
  // que es. Al reves, uno lee el texto y no mira la captura.
  const entradaRotulo = spring({
    frame: cuadro - Math.round(fps * 0.35),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  const marco = movimientoDe(movimiento, avance, dispositivo === 'computador');

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema, fontFamily: LETRA }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 180,
          opacity: entrada,
          transform: `translateY(${interpolate(entrada, [0, 1], [60, 0])}px)`,
        }}
      >
        {dispositivo === 'celular' ? (
          <MarcoCelular captura={captura} ancho={600} estilo={marco} />
        ) : (
          <MarcoComputador captura={captura} ancho={980} estilo={marco} />
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 250 }}>
        <div
          style={{
            margin: '0 60px',
            background: 'rgba(31,27,23,0.9)',
            borderRadius: 28,
            padding: '32px 42px',
            opacity: entradaRotulo,
            transform: `translateY(${interpolate(entradaRotulo, [0, 1], [30, 0])}px)`,
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
