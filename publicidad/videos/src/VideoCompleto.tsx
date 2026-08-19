import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  El video de PamploHogar: 31 segundos, sin grabar nada.

    0 - 7 s     El problema, en tres frases.
    7 - 9,5 s   El giro.
    9,5 - 27 s  La plataforma: seis pantallas, una cada 2,9 segundos.
    27 - 31 s   El cierre con el codigo.

  POR QUE 31 Y NO 42. La version anterior se sentia lenta y lo era: cada frase
  duraba tres segundos y cada pantalla casi cuatro. En publicidad el tiempo se
  mide en cuanto tarda alguien en deslizar el dedo, no en cuanto tarda uno en
  leer comodo. Al recortar un tercio no se perdio nada: se leen igual y ahora
  empujan.

  EL HILO, que antes no se sentia. Todo el video dice una sola cosa: hoy buscar
  arriendo en Pamplona es PREGUNTAR, y esto es no tener que preguntarle a
  nadie. El problema plantea la pregunta, el giro la nombra, cada funcion la
  responde y el cierre la remata. Antes cada frase iba por su lado y por eso
  sonaba deshilvanada.

  Para cambiar el video se tocan las dos listas de abajo.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_FRASE = s(2.3);
const DURACION_GIRO = s(2.6);
const DURACION_ESCENA = s(2.9);
const DURACION_CIERRE = s(4.4);

const PROBLEMA = [
  ['Buscar arriendo en Pamplona', 'es preguntar.'],
  ['Preguntarle al grupo. Preguntarle al vecino.', 'Preguntar cuánto vale.'],
  ['Y esperar', 'que alguien conteste.'],
];

/*
  Las seis pantallas.

  El orden no es casual: primero lo que se ve de una, despues lo que hay que
  abrir, y al final lo que no tiene nadie mas.

  Se alternan celular y computador: el cambio de forma, una alta y una ancha,
  refresca la vista sin que uno se de cuenta.

  Cada rotulo responde a la pregunta que dejo el problema. El primer renglon
  va en negro y el segundo en terracota, que es donde cae el remate.

  Los recorridos van sobre capturas de pagina completa. El listado del celular
  mide diez pantallas, asi que bajar hasta 0,2 ya recorre dos pantallas largas.

  Las escenas de computador van ampliadas. El portatil cabe entero en el video,
  pero entero no se lee: la letra de la pagina queda del tamano de un grano de
  arroz en un celular. Como la captura se toma al doble de resolucion, ampliar
  hasta 1,6 sigue estando por debajo de su tamano real.
*/
const ESCENAS: DatosEscena[] = [
  {
    captura: 'capturas/celular/1-portada.png',
    dispositivo: 'celular',
    rotulo: ['Todos los arriendos,', 'en una sola pantalla'],
    movimiento: 'acercar',
    // La portada es una captura de una sola ventana, un pelo mas cuadrada que
    // la pantalla del telefono: sin este 6% quedaria una franja crema abajo.
    ampliar: 1.06,
  },
  {
    captura: 'capturas/celular/2-listado-largo.png',
    dispositivo: 'celular',
    rotulo: ['El precio va de frente,', 'sin preguntar'],
    movimiento: 'bajar',
    desde: 0.04,
    hasta: 0.22,
  },
  {
    captura: 'capturas/computador/2-listado-largo.png',
    dispositivo: 'computador',
    rotulo: ['Y a cuántos minutos', 'queda de la U'],
    movimiento: 'bajar',
    desde: 0.16,
    hasta: 0.3,
    ampliar: 1.4,
  },
  {
    captura: 'capturas/computador/3-ficha-larga.png',
    dispositivo: 'computador',
    rotulo: ['Si te están cobrando de más,', 'te lo dice'],
    movimiento: 'bajar',
    // Calculado para que la regla de precios entre en cuadro y se quede: es
    // la funcion que no tiene nadie mas, y ampliada por fin se lee.
    desde: 0.4,
    hasta: 0.45,
    ampliar: 1.6,
    centroX: 0.37,
  },
  {
    captura: 'capturas/computador/5-mapa-precios.png',
    dispositivo: 'computador',
    rotulo: ['El mapa de precios', 'de toda la ciudad'],
    movimiento: 'acercar',
    desde: 0.11,
    ampliar: 1.25,
  },
  {
    captura: 'capturas/celular/7-roomies-largo.png',
    dispositivo: 'celular',
    rotulo: ['Y con quién compartir,', 'antes de mudarte'],
    movimiento: 'bajar',
    desde: 0.06,
    hasta: 0.36,
  },
];

const COMIENZO_ESCENAS = DURACION_FRASE * PROBLEMA.length + DURACION_GIRO;
const COMIENZO_CIERRE = COMIENZO_ESCENAS + DURACION_ESCENA * ESCENAS.length;

export const DURACION_TOTAL = COMIENZO_CIERRE + DURACION_CIERRE;

/**
 * Una frase del problema, palabra por palabra.
 *
 * Aparecer de golpe se lee como una diapositiva. Palabra por palabra obliga a
 * leer al ritmo que uno quiere, que es el mismo truco de un buen subtitulo.
 *
 * Cada palabra entra un cuadro y medio despues de la anterior. Con 2,5 la
 * frase todavia se estaba escribiendo cuando ya tocaba cambiarla.
 */
function Frase({ texto, resaltado }: { texto: string; resaltado: string }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const palabras = [
    ...texto.split(' ').map((p) => ({ p, fuerte: false })),
    ...resaltado.split(' ').map((p) => ({ p, fuerte: true })),
  ];

  const salida = interpolate(cuadro, [DURACION_FRASE - 8, DURACION_FRASE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: LETRA, padding: '0 90px', justifyContent: 'center', opacity: salida }}
    >
      <p
        style={{
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 20px',
        }}
      >
        {palabras.map(({ p, fuerte }, i) => {
          const entrada = spring({
            frame: cuadro - i * 1.5,
            fps,
            config: { damping: 200, stiffness: 160 },
          });
          return (
            <span
              key={p + i}
              style={{
                color: fuerte ? COLOR.terracota : COLOR.piedra,
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [26, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {p}
            </span>
          );
        })}
      </p>
    </AbsoluteFill>
  );
}

/** El giro: la pregunta que abre la segunda mitad. */
function Giro() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 90 } });
  const acercar = interpolate(cuadro, [0, DURACION_GIRO], [1.05, 1]);
  const salida = interpolate(cuadro, [DURACION_GIRO - 9, DURACION_GIRO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        padding: '0 90px',
        justifyContent: 'center',
        opacity: entrada * salida,
        transform: `scale(${acercar})`,
      }}
    >
      <p
        style={{
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -2,
          color: COLOR.piedra,
          margin: 0,
        }}
      >
        ¿Y si no tuvieras que{' '}
        <span style={{ color: COLOR.terracota }}>preguntarle a nadie?</span>
      </p>
    </AbsoluteFill>
  );
}

/**
 * La marca arriba, mientras se muestran las funciones.
 *
 * Un comercial nunca esconde de quien es. Va pequena y quieta: si se moviera
 * competiria con lo unico que tiene que mirarse, que es la pantalla.
 */
function Marca() {
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
function Avance() {
  const cuadro = useCurrentFrame();

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ height: 7, background: 'rgba(31,27,23,0.10)' }}>
        <div
          style={{
            height: '100%',
            width: `${(cuadro / DURACION_TOTAL) * 100}%`,
            background: COLOR.terracota,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

/** El cierre: logo, direccion y codigo. */
function Cierre() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 100 } });
  const entradaCodigo = spring({
    frame: cuadro - Math.round(fps * 0.45),
    fps,
    config: { damping: 200, stiffness: 120 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: LETRA, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          opacity: entrada,
          transform: `translateY(${interpolate(entrada, [0, 1], [44, 0])}px) scale(${interpolate(
            entrada,
            [0, 1],
            [0.92, 1],
          )})`,
          textAlign: 'center',
        }}
      >
        <Img src={staticFile('marca-icono.png')} style={{ width: 240, height: 240 }} />
        <p
          style={{
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            color: COLOR.terracota,
            letterSpacing: -2,
          }}
        >
          pamplohogar.com
        </p>
        <p style={{ marginTop: 12, fontSize: 42, fontWeight: 600, color: COLOR.piedra }}>
          Arriendos en Pamplona.
        </p>
        <p style={{ marginTop: 2, fontSize: 42, fontWeight: 600, color: COLOR.piedraGris }}>
          Sin preguntarle a nadie.
        </p>
      </div>

      <div
        style={{
          opacity: entradaCodigo,
          marginTop: 56,
          transform: `scale(${interpolate(entradaCodigo, [0, 1], [0.85, 1])})`,
          background: '#fff',
          padding: 18,
          borderRadius: 26,
          boxShadow: '0 24px 50px -20px rgba(31,27,23,0.35)',
        }}
      >
        <Img src={staticFile('qr-pamplohogar.png')} style={{ width: 260, height: 260 }} />
      </div>
    </AbsoluteFill>
  );
}

export function VideoCompleto() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      {PROBLEMA.map(([texto, resaltado], i) => (
        <Sequence key={texto} from={DURACION_FRASE * i} durationInFrames={DURACION_FRASE}>
          <Frase texto={texto} resaltado={resaltado} />
        </Sequence>
      ))}

      <Sequence from={DURACION_FRASE * PROBLEMA.length} durationInFrames={DURACION_GIRO}>
        <Giro />
      </Sequence>

      <Sequence
        from={COMIENZO_ESCENAS}
        durationInFrames={DURACION_ESCENA * ESCENAS.length}
      >
        <Marca />
      </Sequence>

      {/* Las escenas se encabalgan: la que entra empieza catorce cuadros antes
          de que se vaya la anterior, y cada una entra por el lado contrario a
          la de antes. Ese cruce es lo que hace que nunca haya un momento
          quieto entre dos pantallas. */}
      {ESCENAS.map((escena, i) => (
        <Sequence
          key={escena.captura}
          from={COMIENZO_ESCENAS + DURACION_ESCENA * i}
          durationInFrames={DURACION_ESCENA + 14}
        >
          <Escena
            {...escena}
            lado={i % 2 === 0 ? 1 : -1}
            indice={i}
            total={ESCENAS.length}
          />
        </Sequence>
      ))}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre />
      </Sequence>

      <Avance />
    </AbsoluteFill>
  );
}
