import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR } from './marca';

/*
  El fondo de noche.

  Es Pamplona vista desde arriba a las nueve: el valle oscuro, las montanas
  recortadas y las ventanas encendidas repartidas por las laderas. Va con el
  video de las preguntas, que habla justamente de como se siente un barrio a
  esa hora.

  NO ES NEGRO. Es la piedra de la marca muy oscurecida. Un negro puro sobre un
  video vertical se lee como un hueco, y ademas rompe con el resto del
  material, que es todo tierra.

  LAS LUCES NO SON AL AZAR. Van en una lista escrita a mano porque el video se
  arma de nuevo cada vez que se renderiza: si se sortearan, cada cuadro
  tendria las suyas y la pantalla quedaria hirviendo. Cada una parpadea a su
  propio ritmo, y ese ritmo sale de su posicion en la lista.
*/

/** Ventanas encendidas: x e y en porcentaje, y el tamano en pixeles. */
const LUCES = [
  [12, 78, 5], [19, 83, 4], [26, 74, 6], [31, 88, 4], [38, 80, 5],
  [44, 91, 4], [49, 76, 6], [55, 85, 5], [61, 79, 4], [66, 90, 5],
  [72, 75, 6], [78, 86, 4], [83, 81, 5], [89, 89, 4], [94, 77, 5],
  [8, 92, 4], [35, 95, 5], [58, 94, 4], [80, 94, 5], [15, 86, 4],
];

export function FondoNoche() {
  const cuadro = useCurrentFrame();

  const vaiven = Math.sin(cuadro / 90);
  const vaiven2 = Math.cos(cuadro / 120);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.noche, overflow: 'hidden' }}>
      {/* El resplandor del pueblo, abajo, como el que se ve desde la carretera. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -420,
          marginLeft: -700,
          width: 1400,
          height: 900,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(210,105,30,0.30) 0%, rgba(210,105,30,0.08) 45%, rgba(210,105,30,0) 72%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          left: -320 + vaiven * 50,
          top: 120 + vaiven2 * 70,
          background: 'radial-gradient(circle, rgba(210,105,30,0.13) 0%, rgba(210,105,30,0) 70%)',
        }}
      />

      {/* Las tejas del centro historico, ahora en claro sobre oscuro. */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.16 }} width="100%" height="100%">
        <defs>
          <pattern id="tejas-noche" width="54" height="27" patternUnits="userSpaceOnUse">
            <path
              d="M0 27C0 12 12 0 27 0s27 12 27 27"
              fill="none"
              stroke="rgba(251,243,236,0.30)"
              strokeWidth="1.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tejas-noche)" />
      </svg>

      {/* Las ventanas encendidas del valle. */}
      {LUCES.map(([x, y, tamano], i) => {
        const brillo = 0.45 + Math.sin(cuadro / (24 + i * 3) + i) * 0.3;
        return (
          <div
            key={`${x}-${y}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: tamano,
              height: tamano,
              borderRadius: '50%',
              background: COLOR.terracotaClaro,
              opacity: Math.max(0.12, brillo),
              boxShadow: `0 0 ${tamano * 3}px ${tamano * 0.8}px rgba(210,105,30,0.35)`,
            }}
          />
        );
      })}

      {/* Las montanas, recortadas contra el resplandor. */}
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -10,
          height: 300,
          width: '100%',
          transform: `translateX(${vaiven * 12}px)`,
        }}
      >
        <path
          d="M0 96 180 48l150 38 170-58 190 62 160-40 200 54 190-36 180 44v96H0Z"
          fill="rgba(36,30,25,0.85)"
        />
        <path
          d="M0 122 210 78l160 34 200-44 180 48 210-30 240 44 240-26v92H0Z"
          fill={COLOR.noche}
        />
      </svg>
    </AbsoluteFill>
  );
}
