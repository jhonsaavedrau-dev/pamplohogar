import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Logo } from './Logo';
import { color, trozos } from './Texto';
import { COLOR, LETRA, VIDEO } from './marca';

/*
  El video de PamploHogar: 59 segundos, sin grabar nada.

    0 - 8,7 s     El problema, en tres frases.
    8,7 - 11,7 s  El giro.
    11,7 - 13,9 s El sello: el logo, animado.
    13,9 - 53,5 s La plataforma: tres capitulos, diez pantallas.
    53,5 - 59 s   El cierre con el codigo.

  POR QUE UN MINUTO Y NO MEDIO. Con seis pantallas se contaba lo que hace la
  plataforma; con diez se demuestra. Buscar, decidir y dar el paso son tres
  cosas distintas, y separarlas en capitulos deja ver que esto no es una lista
  de funciones sueltas sino un camino completo.

  EL HILO. Todo el video dice una sola cosa: hoy buscar arriendo en Pamplona es
  PREGUNTAR, y esto es no tener que preguntarle a nadie. El problema plantea la
  pregunta, el giro la nombra, los tres capitulos la responden y el cierre la
  remata.

  EL NARANJA se reserva para tres palabras en todo el video -- preguntar,
  esperar, nadie -- y para la etiqueta del capitulo. Antes se marcaba una
  palabra en cada rotulo y terminaba resaltando cosas que no lo merecian: si
  todo esta resaltado, nada lo esta.

  EL RITMO va un tercio mas lento que la version anterior. Cada frase dura casi
  tres segundos y cada pantalla tres y medio, y las palabras entran mas
  espaciadas. Rapido no es lo mismo que agil: si no da tiempo de leer, la prisa
  se vuelve ruido.

  Para cambiar el video se tocan las dos listas de abajo.
*/

const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

const DURACION_FRASE = s(2.9);
const DURACION_GIRO = s(3);
const DURACION_SELLO = s(2.2);
const DURACION_CAPITULO = s(1.4);
const DURACION_ESCENA = s(3.5);
const DURACION_CIERRE = s(5.5);

const PROBLEMA = [
  'Buscar arriendo en Pamplona es *preguntar.*',
  'Preguntarle al grupo. Al vecino. Al conocido de un conocido.',
  'Y *esperar.* A veces, nadie contesta.',
];

/*
  Los tres capitulos y sus pantallas.

  El orden cuenta un camino: primero se busca, despues se decide y al final se
  da el paso. Dentro de cada capitulo va primero lo que se ve de una y despues
  lo que hay que abrir.

  Se alternan celular y computador siempre que se puede: el cambio de forma,
  una alta y una ancha, refresca la vista sin que uno se de cuenta.

  Los recorridos van sobre capturas de pagina completa, y desde/hasta son
  fracciones del alto de la PAGINA, no de la pantalla.

  Las escenas de computador van ampliadas. El portatil cabe entero en el video,
  pero entero no se lee: la letra de la pagina queda del tamano de un grano de
  arroz en un celular. Como la captura se toma al doble de resolucion, ampliar
  hasta 1,6 sigue estando por debajo de su tamano real.
*/
interface Capitulo {
  titulo: string;
  escenas: DatosEscena[];
}

const CAPITULOS: Capitulo[] = [
  {
    titulo: 'Para buscar',
    escenas: [
      {
        captura: 'capturas/celular/1-portada.png',
        dispositivo: 'celular',
        rotulo: ['Todos los arriendos,', 'en una sola pantalla'],
        movimiento: 'acercar',
        // La portada es una captura de una sola ventana, un pelo mas cuadrada
        // que la pantalla del telefono. El 6% de mas la hace calzar, y bajarla
        // un 3% reparte el recorte entre arriba y abajo.
        ampliar: 1.06,
        desde: 0.03,
      },
      {
        captura: 'capturas/computador/8-filtros.png',
        dispositivo: 'computador',
        rotulo: ['Filtra por barrio, precio', 'y lo que necesites'],
        movimiento: 'bajar',
        desde: 0.12,
        hasta: 0.26,
        ampliar: 1.4,
        centroX: 0.44,
      },
      {
        captura: 'capturas/celular/2-listado-largo.png',
        dispositivo: 'celular',
        rotulo: ['El precio va de frente,', 'sin preguntar'],
        movimiento: 'bajar',
        desde: 0.04,
        hasta: 0.24,
      },
    ],
  },
  {
    titulo: 'Para decidir',
    escenas: [
      {
        captura: 'capturas/computador/3-ficha-larga.png',
        dispositivo: 'computador',
        rotulo: ['Si te están cobrando de más,', 'te lo dice'],
        movimiento: 'bajar',
        // Calculado para que la regla de precios entre en cuadro y se quede:
        // es la funcion que no tiene nadie mas, y ampliada por fin se lee.
        desde: 0.4,
        hasta: 0.46,
        ampliar: 1.6,
        centroX: 0.37,
      },
      {
        captura: 'capturas/celular/3-ficha-larga.png',
        dispositivo: 'celular',
        rotulo: ['Lo que cuentan', 'los que ya vivieron ahí'],
        movimiento: 'bajar',
        // Se abre justo en "Que dicen del arrendador". Mas arriba se veia el
        // recuadro de que todavia nadie ha contado como es el barrio, que es
        // verdad pero no es lo que se esta mostrando.
        desde: 0.52,
        hasta: 0.6,
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
        captura: 'capturas/computador/4-comparar.png',
        dispositivo: 'computador',
        rotulo: ['Y hasta tres,', 'lado a lado'],
        movimiento: 'bajar',
        desde: 0.14,
        hasta: 0.34,
        ampliar: 1.35,
        centroX: 0.44,
      },
    ],
  },
  {
    titulo: 'Para dar el paso',
    escenas: [
      {
        captura: 'capturas/celular/7-roomies-largo.png',
        dispositivo: 'celular',
        rotulo: ['Y con quién compartir,', 'antes de mudarte'],
        movimiento: 'bajar',
        desde: 0.06,
        hasta: 0.36,
      },
      {
        captura: 'capturas/celular/5-ficha-imprimible.png',
        dispositivo: 'celular',
        rotulo: ['La ficha, para llevártela', 'impresa o en PDF'],
        movimiento: 'bajar',
        desde: 0.03,
        hasta: 0.28,
      },
      {
        captura: 'capturas/computador/7-el-proyecto.png',
        dispositivo: 'computador',
        rotulo: ['Hecho en Pamplona,', 'por una sola persona'],
        movimiento: 'bajar',
        desde: 0.02,
        hasta: 0.16,
        ampliar: 1.35,
        centroX: 0.47,
      },
    ],
  },
];

const ESCENAS_TOTALES = CAPITULOS.reduce((n, c) => n + c.escenas.length, 0);

const COMIENZO_SELLO = DURACION_FRASE * PROBLEMA.length + DURACION_GIRO;
const COMIENZO_ACTO = COMIENZO_SELLO + DURACION_SELLO;
const DURACION_ACTO =
  DURACION_CAPITULO * CAPITULOS.length + DURACION_ESCENA * ESCENAS_TOTALES;
const COMIENZO_CIERRE = COMIENZO_ACTO + DURACION_ACTO;

export const DURACION_TOTAL = COMIENZO_CIERRE + DURACION_CIERRE;

/**
 * Una frase del problema, palabra por palabra.
 *
 * Cada palabra entra desenfocada, sube y se enfoca. El desenfoque es lo que
 * separa un texto que aparece de un texto que ENTRA: el ojo lo lee como algo
 * que se acerca desde el fondo, y es el mismo recurso de los titulos de cine.
 *
 * Van a dos cuadros y medio por palabra. Con uno y medio la frase se escribia
 * mas rapido de lo que se puede leer, que era el reclamo.
 */
function Frase({ texto }: { texto: string }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const salida = interpolate(cuadro, [DURACION_FRASE - 9, DURACION_FRASE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const acercar = interpolate(cuadro, [0, DURACION_FRASE], [1, 1.04]);
  const subir = interpolate(cuadro, [0, DURACION_FRASE], [0, -20]);

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        padding: '0 90px',
        justifyContent: 'center',
        opacity: salida,
        transform: `scale(${acercar}) translateY(${subir}px)`,
      }}
    >
      <p
        style={{
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.14,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 20px',
        }}
      >
        {trozos(texto).map(({ palabra, fuerte }, i) => {
          const entrada = spring({
            frame: cuadro - i * 2.5,
            fps,
            config: { damping: 200, stiffness: 130 },
          });
          return (
            <span
              key={palabra + i}
              style={{
                color: color(fuerte),
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [30, 0])}px)`,
                filter: `blur(${interpolate(entrada, [0, 1], [12, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {palabra}
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

  const acercar = interpolate(cuadro, [0, DURACION_GIRO], [1.07, 1]);
  const salida = interpolate(cuadro, [DURACION_GIRO - 10, DURACION_GIRO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        padding: '0 90px',
        justifyContent: 'center',
        opacity: salida,
        transform: `scale(${acercar})`,
      }}
    >
      <p
        style={{
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -2,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 20px',
        }}
      >
        {trozos('¿Y si no tuvieras que preguntarle a *nadie?*').map(({ palabra, fuerte }, i) => {
          const entrada = spring({
            frame: cuadro - i * 2.5,
            fps,
            config: { damping: 200, stiffness: 130 },
          });
          return (
            <span
              key={palabra + i}
              style={{
                color: color(fuerte),
                opacity: entrada,
                transform: `translateY(${interpolate(entrada, [0, 1], [30, 0])}px)`,
                filter: `blur(${interpolate(entrada, [0, 1], [12, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {palabra}
            </span>
          );
        })}
      </p>
    </AbsoluteFill>
  );
}

/** El sello: la marca aparece en la bisagra del video. */
function Sello() {
  const cuadro = useCurrentFrame();

  const salida = interpolate(cuadro, [DURACION_SELLO - 9, DURACION_SELLO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: LETRA, alignItems: 'center', justifyContent: 'center', opacity: salida }}
    >
      <Logo tamano={240} conDireccion />
    </AbsoluteFill>
  );
}

/**
 * La portada de un capitulo.
 *
 * Segundo y medio de respiro entre bloques de pantallas. Sin estos cortes las
 * diez escenas se leen como una lista larga; con ellos se lee un camino de tres
 * pasos, que es lo que de verdad es.
 */
function PortadaCapitulo({ titulo, numero }: { titulo: string; numero: number }) {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame: cuadro, fps, config: { damping: 200, stiffness: 100 } });
  const linea = spring({
    frame: cuadro - Math.round(fps * 0.18),
    fps,
    config: { damping: 200, stiffness: 70 },
  });
  const salida = interpolate(cuadro, [DURACION_CAPITULO - 8, DURACION_CAPITULO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        justifyContent: 'center',
        padding: '0 90px',
        opacity: salida,
      }}
    >
      <span
        style={{
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 8,
          color: COLOR.terracota,
          opacity: entrada,
        }}
      >
        {String(numero).padStart(2, '0')}
      </span>

      <div style={{ overflow: 'hidden', padding: '18px 0 10px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -3,
            color: COLOR.piedra,
            transform: `translateY(${interpolate(entrada, [0, 1], [110, 0])}%)`,
            filter: `blur(${interpolate(entrada, [0, 1], [14, 0])}px)`,
          }}
        >
          {titulo}
        </p>
      </div>

      <div style={{ height: 6, width: `${linea * 100}%`, background: COLOR.terracota, borderRadius: 999 }} />
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
 * quedarse, y en un video de un minuto pesa mas que en uno de treinta
 * segundos.
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

/** El cierre: el logo animado, la direccion, el codigo y el remate. */
function Cierre() {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();

  const direccion = spring({
    frame: cuadro - Math.round(fps * 0.55),
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const codigo = spring({
    frame: cuadro - Math.round(fps * 0.9),
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const remate = spring({
    frame: cuadro - Math.round(fps * 1.35),
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: LETRA,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Logo tamano={190} />

      <p
        style={{
          margin: '38px 0 0',
          fontSize: 68,
          fontWeight: 800,
          letterSpacing: -2,
          color: COLOR.terracota,
          clipPath: `inset(0 ${(1 - direccion) * 100}% 0 0)`,
        }}
      >
        pamplohogar.com
      </p>

      <div
        style={{
          opacity: codigo,
          marginTop: 42,
          transform: `scale(${interpolate(codigo, [0, 1], [0.85, 1])})`,
          background: '#fff',
          padding: 18,
          borderRadius: 26,
          boxShadow: '0 24px 50px -20px rgba(31,27,23,0.35)',
        }}
      >
        <Img src={staticFile('qr-pamplohogar.png')} style={{ width: 240, height: 240 }} />
      </div>

      <p
        style={{
          margin: '38px 0 0',
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 12px',
          opacity: remate,
          transform: `translateY(${interpolate(remate, [0, 1], [22, 0])}px)`,
        }}
      >
        {trozos('Arriendos en Pamplona. Sin preguntarle a *nadie.*').map(({ palabra, fuerte }, i) => (
          <span key={palabra + i} style={{ color: color(fuerte) }}>
            {palabra}
          </span>
        ))}
      </p>
    </AbsoluteFill>
  );
}

export function VideoCompleto() {
  // Las escenas se encabalgan quince cuadros: la que entra empieza antes de que
  // termine de irse la anterior. Por eso el reloj se lleva a mano en vez de
  // multiplicar indices.
  let reloj = COMIENZO_ACTO;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <Fondo />

      {PROBLEMA.map((texto, i) => (
        <Sequence key={texto} from={DURACION_FRASE * i} durationInFrames={DURACION_FRASE}>
          <Frase texto={texto} />
        </Sequence>
      ))}

      <Sequence from={DURACION_FRASE * PROBLEMA.length} durationInFrames={DURACION_GIRO}>
        <Giro />
      </Sequence>

      <Sequence from={COMIENZO_SELLO} durationInFrames={DURACION_SELLO}>
        <Sello />
      </Sequence>

      <Sequence from={COMIENZO_ACTO} durationInFrames={DURACION_ACTO}>
        <Marca />
      </Sequence>

      {CAPITULOS.flatMap((capitulo, c) => {
        const piezas = [
          <Sequence key={capitulo.titulo} from={reloj} durationInFrames={DURACION_CAPITULO}>
            <PortadaCapitulo titulo={capitulo.titulo} numero={c + 1} />
          </Sequence>,
        ];
        reloj += DURACION_CAPITULO;

        capitulo.escenas.forEach((escena, i) => {
          piezas.push(
            <Sequence
              key={escena.captura}
              from={reloj}
              durationInFrames={DURACION_ESCENA + 15}
            >
              <Escena
                {...escena}
                lado={i % 2 === 0 ? 1 : -1}
                capitulo={capitulo.titulo}
              />
            </Sequence>,
          );
          reloj += DURACION_ESCENA;
        });

        return piezas;
      })}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre />
      </Sequence>

      <Avance />
    </AbsoluteFill>
  );
}
