import { AbsoluteFill, Img, staticFile } from 'remotion';
import { COLOR, LETRA } from './marca';

/*
  Tarjetas sueltas para meter en CapCut.

  No son videos: son imagenes que se exportan con `remotion still` y se
  arrastran a la linea de tiempo. Existen porque son justo los momentos donde
  un video grabado con celular se ve amateur, y hechas con la letra y los
  colores de la marca levantan todo lo demas.

  Se exportan con:

    npm run tarjetas
*/

const base: React.CSSProperties = {
  backgroundColor: COLOR.crema,
  fontFamily: LETRA,
  padding: '0 100px',
  justifyContent: 'center',
};

/** La pausa del segundo 15, entre el problema y la solucion. */
export function TarjetaGiro() {
  return (
    <AbsoluteFill style={base}>
      <p
        style={{
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -2,
          color: COLOR.piedra,
          margin: 0,
        }}
      >
        ¿Y si todos los arriendos de Pamplona estuvieran en{' '}
        <span style={{ color: COLOR.terracota }}>un solo sitio?</span>
      </p>
    </AbsoluteFill>
  );
}

/** El cierre, con la direccion y el codigo. */
export function TarjetaCierre() {
  return (
    <AbsoluteFill style={{ ...base, alignItems: 'center' }}>
      <Img src={staticFile('marca-icono.png')} style={{ width: 260, height: 260 }} />
      <p
        style={{
          marginTop: 60,
          fontSize: 84,
          fontWeight: 800,
          color: COLOR.terracota,
          letterSpacing: -2,
        }}
      >
        pamplohogar.com
      </p>
      <p
        style={{
          marginTop: 16,
          fontSize: 40,
          color: COLOR.piedraGris,
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        Arriendos para estudiantes
        <br />
        en Pamplona
      </p>
      <Img
        src={staticFile('qr-pamplohogar.png')}
        style={{ width: 280, height: 280, marginTop: 60, borderRadius: 22 }}
      />
    </AbsoluteFill>
  );
}

/*
  Las tarjetas de cada funcion, para el acto 3.

  Van sobre la grabacion de pantalla, en la franja de abajo, donde no tapan lo
  que se esta mostrando. El fondo oscuro semitransparente es para que el texto
  se lea encima de cualquier captura, clara u oscura.
*/
export function TarjetaFuncion({ texto = 'El precio, sin preguntar' }: { texto?: string }) {
  return (
    <AbsoluteFill style={{ fontFamily: LETRA, justifyContent: 'flex-end', paddingBottom: 260 }}>
      <div
        style={{
          margin: '0 60px',
          background: 'rgba(31,27,23,0.88)',
          borderRadius: 28,
          padding: '34px 44px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 54,
            fontWeight: 700,
            color: COLOR.blanco,
            lineHeight: 1.2,
          }}
        >
          {texto}
        </p>
      </div>
    </AbsoluteFill>
  );
}

/*
  Tarjeta de texto suelta, para los tramos donde no hay nada que mostrar.

  El acto 1 del video cuenta el problema, y del problema no hay capturas: no
  se puede fotografiar la ausencia de una plataforma. Va contado con frases
  cortas sobre el crema de la marca.

  La palabra en terracota se marca escribiendo el texto en dos partes.
*/
export function TarjetaTexto({
  texto = 'En Pamplona, conseguir dónde vivir',
  resaltado = 'depende de a quién conozcas.',
}: {
  texto?: string;
  resaltado?: string;
}) {
  return (
    <AbsoluteFill style={base}>
      <p
        style={{
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -2,
          color: COLOR.piedra,
          margin: 0,
        }}
      >
        {texto}{' '}
        <span style={{ color: COLOR.terracota }}>{resaltado}</span>
      </p>
    </AbsoluteFill>
  );
}
