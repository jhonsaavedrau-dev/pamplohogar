import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, LETRA } from './marca';

/*
  Historia vertical de 15 segundos: "llegaste sin conocer a nadie".

  El guion, por segundos:

    0 - 3   El logo aparece solo, para que la marca quede antes del mensaje.
    3 - 7   La pregunta que le duele a quien acaba de llegar.
    7 - 11  Las tres cosas que la plataforma muestra y nadie mas muestra.
    11 - 15 La direccion y el codigo, que es lo unico que tiene que recordar.

  Todo entra desde abajo y con un rebote corto. Nada gira ni parpadea: eso
  distrae del texto, que es lo unico que importa en una historia que se ve con
  el dedo listo para pasar a la siguiente.
*/

/** Entrada suave desde abajo, con el rebote justo. */
function useEntrada(desdeElCuadro: number) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const avance = spring({
    frame: cuadro - desdeElCuadro,
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return {
    opacity: avance,
    transform: `translateY(${interpolate(avance, [0, 1], [45, 0])}px)`,
  };
}

/** Desaparece al final del tramo, para que no se amontone con lo siguiente. */
function useSalida(hastaElCuadro: number) {
  const cuadro = useCurrentFrame();
  return {
    opacity: interpolate(cuadro, [hastaElCuadro - 12, hastaElCuadro], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
}

function Punto({ texto, desde }: { texto: string; desde: number }) {
  const entrada = useEntrada(desde);
  return (
    <div
      style={{
        ...entrada,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        fontSize: 52,
        fontWeight: 600,
        color: COLOR.piedra,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: COLOR.terracotaClaro,
          flexShrink: 0,
        }}
      />
      {texto}
    </div>
  );
}

export function HistoriaSinConocidos() {
  const cuadro = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = (segundos: number) => Math.round(segundos * fps);

  const logo = useEntrada(0);
  const pregunta = useEntrada(s(3));
  const salidaPregunta = useSalida(s(7));
  const cierre = useEntrada(s(11));
  const salidaPuntos = useSalida(s(11));

  // El logo se encoge y sube cuando entra el texto, para dejarle el centro.
  const encogido = interpolate(cuadro, [s(2.6), s(3.4)], [1, 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema, fontFamily: LETRA }}>
      {/* El logo, siempre presente: arranca en el centro y se recoge arriba. */}
      <AbsoluteFill
        style={{
          ...logo,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: interpolate(cuadro, [s(2.6), s(3.4)], [820, 210], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <Img
          src={staticFile('marca-icono.png')}
          style={{ width: 320 * encogido, height: 320 * encogido }}
        />
      </AbsoluteFill>

      {/* La pregunta */}
      {cuadro >= s(3) && cuadro < s(7.5) && (
        <AbsoluteFill
          style={{
            ...pregunta,
            ...salidaPregunta,
            padding: '0 90px',
            justifyContent: 'center',
            paddingBottom: 220,
          }}
        >
          <p
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: COLOR.piedra,
              margin: 0,
            }}
          >
            ¿Llegaste a Pamplona
            <span style={{ display: 'block', color: COLOR.terracota }}>
              sin conocer a nadie?
            </span>
          </p>
          <p
            style={{
              marginTop: 34,
              fontSize: 46,
              lineHeight: 1.35,
              color: COLOR.piedraGris,
            }}
          >
            Aquí no necesitas un primo ni un paisano para conseguir dónde vivir.
          </p>
        </AbsoluteFill>
      )}

      {/* Lo que la plataforma muestra */}
      {cuadro >= s(7) && cuadro < s(11.5) && (
        <AbsoluteFill
          style={{
            ...salidaPuntos,
            padding: '0 90px',
            justifyContent: 'center',
            gap: 46,
          }}
        >
          <Punto texto="El precio antes de escribir" desde={s(7.2)} />
          <Punto texto="A cuántos minutos queda de la U" desde={s(8.0)} />
          <Punto texto="Si está caro para ese barrio" desde={s(8.8)} />
          <Punto texto="Lo que dicen los que vivieron ahí" desde={s(9.6)} />
        </AbsoluteFill>
      )}

      {/* El cierre: la direccion y el codigo */}
      {cuadro >= s(11) && (
        <AbsoluteFill
          style={{ ...cierre, padding: '0 90px', justifyContent: 'center', alignItems: 'center' }}
        >
          <p
            style={{
              fontSize: 78,
              fontWeight: 800,
              color: COLOR.terracota,
              letterSpacing: -2,
              margin: 0,
            }}
          >
            pamplohogar.com
          </p>
          <Img
            src={staticFile('qr-pamplohogar.png')}
            style={{ width: 300, height: 300, marginTop: 50, borderRadius: 24 }}
          />
          <p style={{ marginTop: 26, fontSize: 38, color: COLOR.piedraSuave }}>
            Apunta la cámara
          </p>
        </AbsoluteFill>
      )}

      {/* Barra de progreso abajo: en una historia dice cuanto falta y hace que
          la gente se quede. */}
      <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
        <div style={{ height: 10, background: '#00000010' }}>
          <div
            style={{
              height: '100%',
              width: `${(cuadro / durationInFrames) * 100}%`,
              background: COLOR.terracotaClaro,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
