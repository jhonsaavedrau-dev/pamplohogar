import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Escena, type DatosEscena } from './Escena';
import { Fondo } from './Fondo';
import { Avance, Cierre, Frase, Marca, Sello } from './Piezas';
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
        // Quieta y no acercandose, que es lo unico que no puede hacer esta
        // escena. La portada es una captura de UNA ventana, no de una pagina
        // larga: al acercarse no hay pagina de donde sacar, asi que el
        // acercamiento se come los bordes y parte las palabras de los lados.
        // El movimiento aqui lo ponen la entrada girada y la flotacion.
        movimiento: 'quieto',
        // La portada es una captura de una sola ventana, un pelo mas cuadrada
        // que la pantalla del telefono: sin ampliarla quedaria una franja
        // crema. Con 1,09 sobra lo justo para que el acercamiento tenga de
        // donde comer, y bajando un 2% el encabezado no se corta. Antes iba en
        // 1,06 y 3%, y al agrandarse el marco de arriba del telefono el logo
        // de la pagina quedaba mordido.
        ampliar: 1.09,
        desde: 0.02,
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
        //
        // Estas fracciones bajaron de 0,40 y 0,46 porque la ficha crecio: al
        // llenarse las opiniones del barrio la pagina paso de 5784 a 7808 de
        // alto, y la regla de precios, que no se movio ni un pixel, quedo mas
        // arriba en proporcion.
        desde: 0.296,
        hasta: 0.341,
        ampliar: 1.6,
        centroX: 0.37,
      },
      {
        captura: 'capturas/celular/3-ficha-larga.png',
        dispositivo: 'celular',
        rotulo: ['Lo que cuentan', 'los que ya vivieron ahí'],
        movimiento: 'bajar',
        // Ahora se abre en "Como es vivir en Chichira", que es donde estan las
        // opiniones del barrio. Antes ese recuadro decia que nadie habia
        // contado nada y tocaba esquivarlo bajando hasta las resenas del
        // arrendador; ya no hay nada que esquivar.
        desde: 0.39,
        hasta: 0.5,
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
          <Frase texto={texto} duracion={DURACION_FRASE} />
        </Sequence>
      ))}

      <Sequence from={DURACION_FRASE * PROBLEMA.length} durationInFrames={DURACION_GIRO}>
        <Giro />
      </Sequence>

      <Sequence from={COMIENZO_SELLO} durationInFrames={DURACION_SELLO}>
        <Sello duracion={DURACION_SELLO} />
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
            <Sequence key={escena.captura} from={reloj} durationInFrames={DURACION_ESCENA + 15}>
              <Escena {...escena} lado={i % 2 === 0 ? 1 : -1} capitulo={capitulo.titulo} />
            </Sequence>,
          );
          reloj += DURACION_ESCENA;
        });

        return piezas;
      })}

      <Sequence from={COMIENZO_CIERRE} durationInFrames={DURACION_CIERRE}>
        <Cierre conCodigo remate="Arriendos en Pamplona. Sin preguntarle a *nadie.*" />
      </Sequence>

      <Avance total={DURACION_TOTAL} />
    </AbsoluteFill>
  );
}
