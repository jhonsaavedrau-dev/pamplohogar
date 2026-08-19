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

  Antes se agrandaba una captura corta para simular movimiento, y agrandar una
  imagen es inventarse pixeles: por eso se veia blanda.
*/

const MARCO = '#2A2521';

interface PropsPantalla {
  captura: string;
  /**
   * Cuanto se ha bajado, de 0 a 1: la fraccion del alto de la imagen que
   * queda por encima del borde superior de la pantalla.
   */
  recorrido?: number;
  /** Acercamiento suave. Con moderacion: mucho zoom vuelve a emborronar. */
  acercamiento?: number;
}

function Pantalla({ captura, recorrido = 0, acercamiento = 1 }: PropsPantalla) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: COLOR.crema }}>
      <Img
        src={staticFile(captura)}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          // El porcentaje de translateY se mide sobre el alto de la propia
          // imagen, que es justo lo que hace falta para desplazar la pagina.
          transform: `scale(${acercamiento}) translateY(${-recorrido * 100}%)`,
          transformOrigin: 'top center',
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
  acercamiento,
}: PropsPantalla & { ancho?: number }) {
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
        boxShadow: '0 50px 90px -25px rgba(31,27,23,0.5)',
        position: 'relative',
      }}
    >
      <div
        style={{ width: '100%', height: '100%', borderRadius: ancho * 0.075, overflow: 'hidden' }}
      >
        <Pantalla captura={captura} recorrido={recorrido} acercamiento={acercamiento} />
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
  acercamiento,
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
          <Pantalla captura={captura} recorrido={recorrido} acercamiento={acercamiento} />
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
