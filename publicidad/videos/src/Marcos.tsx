import { Img, staticFile } from 'remotion';
import { COLOR } from './marca';

/*
  Los marcos de celular y de computador, dibujados con codigo.

  No son imagenes descargadas: son un borde redondeado y una sombra. Asi no
  dependen de un archivo que se pueda perder, no hay licencias de por medio, y
  cambiar el color o el grosor es cambiar un numero.

  Para que sirven: una captura suelta flotando en la pantalla se ve como una
  imagen pegada. Metida en un marco de telefono, el cerebro entiende de una que
  eso es una aplicacion y que se usa con el dedo.
*/

const MARCO = '#2A2521';

/**
 * El contenido que va dentro del marco, con su propio movimiento.
 *
 * La imagen va mas grande que la ventana y se mueve dentro: asi el movimiento
 * se ve como si alguien estuviera recorriendo la pantalla, y nunca aparece un
 * borde vacio.
 */
function Pantalla({ captura, estilo }: { captura: string; estilo: React.CSSProperties }) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: COLOR.crema }}>
      <Img
        src={staticFile(captura)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          ...estilo,
        }}
      />
    </div>
  );
}

/** Un celular. El ancho manda y el alto sale de la proporcion 390 por 844. */
export function MarcoCelular({
  captura,
  ancho = 620,
  estilo = {},
}: {
  captura: string;
  ancho?: number;
  estilo?: React.CSSProperties;
}) {
  const borde = Math.round(ancho * 0.026);
  const alto = Math.round((ancho * 844) / 390 + borde * 3.4);

  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: ancho * 0.095,
        background: MARCO,
        padding: `${borde * 2.4}px ${borde}px`,
        boxShadow: '0 40px 80px -20px rgba(31,27,23,0.45)',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: ancho * 0.075,
          overflow: 'hidden',
        }}
      >
        <Pantalla captura={captura} estilo={estilo} />
      </div>

      {/* La islita, en el borde de arriba y no encima de la pantalla: asi no
          tapa el encabezado de la captura. */}
      <div
        style={{
          position: 'absolute',
          top: borde * 0.85,
          left: '50%',
          transform: 'translateX(-50%)',
          width: ancho * 0.26,
          height: ancho * 0.055,
          borderRadius: 999,
          background: '#000',
        }}
      />
    </div>
  );
}

/** Un computador portatil: pantalla y base. */
export function MarcoComputador({
  captura,
  ancho = 1000,
  estilo = {},
}: {
  captura: string;
  ancho?: number;
  estilo?: React.CSSProperties;
}) {
  const alto = Math.round((ancho * 800) / 1280);
  const borde = Math.round(ancho * 0.014);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: ancho,
          height: alto,
          borderRadius: 22,
          background: MARCO,
          padding: borde,
          boxShadow: '0 40px 80px -20px rgba(31,27,23,0.45)',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
          <Pantalla captura={captura} estilo={estilo} />
        </div>
      </div>

      {/* La base. Un poco mas ancha que la pantalla, como en un portatil de
          verdad, y con una muesca en el centro. */}
      <div
        style={{
          width: ancho * 1.08,
          height: 22,
          borderRadius: '0 0 16px 16px',
          background: MARCO,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: ancho * 0.14,
            height: 7,
            borderRadius: '0 0 8px 8px',
            background: '#4A443B',
          }}
        />
      </div>
    </div>
  );
}
