import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, LETRA_SERIF } from './marca';

/*
  El logo, animado.

  Un logo que solo aparece se lee como una calcomania pegada al final. Este se
  arma en tres tiempos, y ese orden es todo:

  1. Un aro de color sale del centro y se desvanece. Es el golpe: avisa que
     algo va a pasar antes de que pase.
  2. La casita cae con un rebote corto, ligeramente girada, y se endereza.
  3. El nombre se descubre de izquierda a derecha, como si alguien lo
     escribiera de un trazo.

  Va dos veces en el video: un sello de segundo y medio justo despues del giro,
  que es donde se pasa del problema a la solucion, y el cierre. Repetir la
  marca en los dos momentos que la gente recuerda es lo que hace cualquier
  comercial que se precie.
*/

export function Logo({
  tamano = 200,
  conDireccion = false,
  retraso = 0,
}: {
  /** Ancho de la casita. El resto del conjunto sale de ahi. */
  tamano?: number;
  /** Si debajo del nombre va tambien pamplohogar.com. */
  conDireccion?: boolean;
  retraso?: number;
}) {
  const cuadro = useCurrentFrame() - retraso;
  const { fps } = useVideoConfig();

  const caida = spring({ frame: cuadro, fps, config: { damping: 12, mass: 0.8, stiffness: 90 } });
  const nombre = spring({
    frame: cuadro - Math.round(fps * 0.22),
    fps,
    config: { damping: 200, stiffness: 130 },
  });
  const direccion = spring({
    frame: cuadro - Math.round(fps * 0.5),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  // El aro: sale del tamano de la casita y se va abriendo hasta el doble,
  // apagandose. Un solo golpe, no un latido.
  const aro = interpolate(cuadro, [0, Math.round(fps * 0.9)], [0.55, 2.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const aroOpacidad = interpolate(cuadro, [0, Math.round(fps * 0.9)], [0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Respiracion: despues de acomodarse, el conjunto sigue vivo apenas.
  const respirar = 1 + Math.sin(cuadro / 26) * 0.012;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: tamano,
          height: tamano,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: tamano,
            height: tamano,
            borderRadius: '50%',
            border: `${Math.max(3, tamano * 0.022)}px solid ${COLOR.terracotaClaro}`,
            transform: `scale(${aro})`,
            opacity: aroOpacidad,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: tamano * 1.6,
            height: tamano * 1.6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(210,105,30,0.20) 0%, rgba(210,105,30,0) 70%)',
            opacity: caida,
          }}
        />
        <Img
          src={staticFile('marca-icono.png')}
          style={{
            width: tamano,
            height: tamano,
            opacity: Math.min(caida * 1.6, 1),
            transform: `translateY(${interpolate(caida, [0, 1], [-tamano * 0.35, 0])}px) rotate(${interpolate(
              caida,
              [0, 1],
              [-14, 0],
            )}deg) scale(${interpolate(caida, [0, 1], [0.7, 1]) * respirar})`,
          }}
        />
      </div>

      {/* El nombre se descubre de izquierda a derecha. Recortar la caja es lo
          que da la sensacion de trazo; mover el texto se veria como que entra
          deslizando, que es otra cosa y mas comun. */}
      <p
        style={{
          margin: `${tamano * 0.13}px 0 0`,
          fontFamily: LETRA_SERIF,
          fontSize: tamano * 0.42,
          fontWeight: 700,
          letterSpacing: -1,
          lineHeight: 1,
          color: COLOR.piedra,
          clipPath: `inset(0 ${(1 - nombre) * 100}% 0 0)`,
        }}
      >
        Pamplo<span style={{ color: COLOR.terracota }}>Hogar</span>
      </p>

      {conDireccion && (
        <p
          style={{
            margin: `${tamano * 0.08}px 0 0`,
            fontSize: tamano * 0.19,
            fontWeight: 700,
            letterSpacing: 1,
            color: COLOR.piedraGris,
            opacity: direccion,
            transform: `translateY(${interpolate(direccion, [0, 1], [16, 0])}px)`,
          }}
        >
          pamplohogar.com
        </p>
      )}
    </div>
  );
}
