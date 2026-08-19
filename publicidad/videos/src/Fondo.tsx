import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLOR } from './marca';

/*
  El fondo del video.

  Un crema plano detras de todo se ve barato: es el color por defecto de una
  diapositiva. Aqui hay tres capas que se mueven a distinta velocidad, y esa
  diferencia es la que da sensacion de profundidad sin que se note nada.

  - Dos manchas de color muy suaves que se pasean.
  - El patron de tejas de la pagina, apenas visible.
  - Las montanas de Pamplona abajo, que son la marca de la casa.

  Todo va lentisimo a proposito. Un fondo que se nota le roba atencion a lo que
  importa, que es la pantalla del medio.
*/

export function Fondo({ intensidad = 1 }: { intensidad?: number }) {
  const cuadro = useCurrentFrame();

  // Las manchas dan una vuelta larga: 20 segundos de ida y vuelta.
  const vaiven = Math.sin(cuadro / 90);
  const vaiven2 = Math.cos(cuadro / 120);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          left: -300 + vaiven * 60,
          top: 180 + vaiven2 * 80,
          background: 'radial-gradient(circle, rgba(232,172,131,0.35) 0%, rgba(232,172,131,0) 70%)',
          opacity: intensidad,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          right: -260 - vaiven * 50,
          bottom: 240 - vaiven2 * 70,
          background: 'radial-gradient(circle, rgba(210,105,30,0.22) 0%, rgba(210,105,30,0) 70%)',
          opacity: intensidad,
        }}
      />

      {/* Las tejas del centro historico, apenas insinuadas. */}
      <svg
        style={{ position: 'absolute', inset: 0, opacity: 0.5 * intensidad }}
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="tejas-video" width="54" height="27" patternUnits="userSpaceOnUse">
            <path
              d="M0 27C0 12 12 0 27 0s27 12 27 27"
              fill="none"
              stroke="rgba(178,83,23,0.16)"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tejas-video)" />
      </svg>

      {/* Las montanas del valle, abajo. Se mueven un pelo mas que las manchas:
          eso es lo que hace que el ojo lea profundidad. */}
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -10,
          height: 260,
          width: '100%',
          transform: `translateX(${vaiven * 14}px)`,
          opacity: intensidad,
        }}
      >
        <path
          d="M0 96 180 48l150 38 170-58 190 62 160-40 200 54 190-36 180 44v96H0Z"
          fill="rgba(242,204,176,0.45)"
        />
        <path
          d="M0 122 210 78l160 34 200-44 180 48 210-30 240 44 240-26v92H0Z"
          fill="rgba(232,172,131,0.35)"
        />
      </svg>
    </AbsoluteFill>
  );
}
