import { Img, staticFile } from 'remotion';
import { COLOR } from './marca';

/*
  Los marcos de celular y de computador, dibujados con codigo.

  No son imagenes descargadas: son un borde redondeado y una sombra. Asi no
  dependen de un archivo que se pueda perder, no hay licencias de por medio, y
  cambiar el color o el grosor es cambiar un numero.

  COMO SE MUEVE LA PANTALLA DE ADENTRO, que es lo que se veia mal antes:

  La captura entra a lo ancho del marco y conserva su alto natural. Como son
  capturas de la pagina COMPLETA, la imagen mide varias pantallas y sobra por
  abajo. Moverla hacia arriba es entonces un desplazamiento de verdad, con
  cada pixel en su sitio.

  POR QUE SE PUEDE AMPLIAR SIN QUE SE VEA MAL. Las capturas se toman al doble
  de resolucion: la del computador mide 2560 de ancho para una ventana de
  1280. Metida en un portatil de 960 en pantalla, sobra la mitad de la
  informacion. Ampliarla hasta un 60% sigue estando por debajo de su tamano
  real, asi que no se inventa ni un pixel, y en cambio el texto de la pagina
  pasa de ilegible a legible en un celular. Ese es el problema del portatil:
  cabe entero, pero entero no se lee.
*/

const MARCO = '#2A2521';

interface PropsPantalla {
  captura: string;
  /**
   * Cuanto se ha bajado, de 0 a 1: la fraccion del alto de la PAGINA que
   * queda por encima del borde superior de la pantalla. No cambia de
   * significado al ampliar.
   */
  recorrido?: number;
  /** 1 es la pagina entera de ancho. 1,6 muestra dos tercios, mas grande. */
  ampliar?: number;
  /** Que punto horizontal de la pagina queda al centro, de 0 a 1. */
  centroX?: number;
}

function Pantalla({ captura, recorrido = 0, ampliar = 1, centroX = 0.5 }: PropsPantalla) {
  // Cuanto hay que correr la imagen para que centroX quede en el medio,
  // medido en porcentaje del ancho de la propia imagen.
  const x = (-(centroX * ampliar - 0.5) / ampliar) * 100;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: COLOR.crema }}>
      <Img
        src={staticFile(captura)}
        style={{
          width: `${ampliar * 100}%`,
          height: 'auto',
          display: 'block',
          // Los dos porcentajes se miden sobre el tamano de la propia imagen,
          // que es justo lo que hace falta para recorrer la pagina.
          transform: `translate(${x}%, ${-recorrido * 100}%)`,
        }}
      />
    </div>
  );
}

/** Un celular. El ancho manda y el alto sale de la proporcion 390 por 844. */
export function MarcoCelular({
  captura,
  ancho = 620,
  recorrido,
  ampliar,
  centroX,
}: PropsPantalla & { ancho?: number }) {
  const borde = Math.round(ancho * 0.026);

  /*
    El marco de arriba tiene que ser mas alto que la islita, o la islita se le
    monta a la pantalla y tapa el logo de la pagina. La islita empieza en
    borde*0.85 y mide ancho*0.055, asi que termina justo por debajo de
    borde*3.4. Antes el marco media borde*2.4 y se comia ocho pixeles de
    pantalla.
  */
  const bordeArriba = Math.round(borde * 3.4);
  const bordeAbajo = Math.round(borde * 2);
  const alto = Math.round((ancho * 844) / 390) + bordeArriba + bordeAbajo;

  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: ancho * 0.095,
        background: MARCO,
        padding: `${bordeArriba}px ${borde}px ${bordeAbajo}px`,
        boxShadow: '0 50px 90px -25px rgba(31,27,23,0.5)',
        position: 'relative',
      }}
    >
      <div
        style={{ width: '100%', height: '100%', borderRadius: ancho * 0.075, overflow: 'hidden' }}
      >
        <Pantalla captura={captura} recorrido={recorrido} ampliar={ampliar} centroX={centroX} />
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
  recorrido,
  ampliar,
  centroX,
}: PropsPantalla & { ancho?: number }) {
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
          boxShadow: '0 50px 90px -25px rgba(31,27,23,0.5)',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
          <Pantalla captura={captura} recorrido={recorrido} ampliar={ampliar} centroX={centroX} />
        </div>
      </div>

      {/* La base, un poco mas ancha que la pantalla y con su muesca. */}
      <div
        style={{
          width: ancho * 1.08,
          height: 22,
          borderRadius: '0 0 16px 16px',
          background: MARCO,
          display: 'flex',
          justifyContent: 'center',
          boxShadow: '0 24px 40px -20px rgba(31,27,23,0.5)',
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
