import { Composition } from 'remotion';
import { HistoriaSinConocidos } from './HistoriaSinConocidos';
import { DURACION_TOTAL, VideoCompleto } from './VideoCompleto';
import { TarjetaCierre, TarjetaFuncion, TarjetaGiro, TarjetaTexto } from './Tarjetas';
import { VIDEO } from './marca';

/*
  El catalogo de videos. Cada Composition es un video que se puede renderizar
  por su nombre:

    npx remotion render HistoriaSinConocidos
*/
export function Root() {
  return (
    <>
      {/* El video principal. La duracion la calcula el propio video sumando
          sus actos: si se agrega una funcion, se alarga solo. */}
      <Composition
        id="VideoCompleto"
        component={VideoCompleto}
        durationInFrames={DURACION_TOTAL}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
      id="HistoriaSinConocidos"
      component={HistoriaSinConocidos}
      durationInFrames={VIDEO.fps * VIDEO.segundos}
      fps={VIDEO.fps}
      width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      {/* Las tarjetas son imagenes, no videos: un solo cuadro. La duracion
          da igual, pero Remotion exige una. */}
      <Composition
        id="TarjetaGiro"
        component={TarjetaGiro}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />
      <Composition
        id="TarjetaCierre"
        component={TarjetaCierre}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />
      <Composition
        id="TarjetaFuncion"
        component={TarjetaFuncion}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
        defaultProps={{ texto: 'El precio, sin preguntar' }}
      />
      <Composition
        id="TarjetaTexto"
        component={TarjetaTexto}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
        defaultProps={{
          texto: 'En Pamplona, conseguir dónde vivir',
          resaltado: 'depende de a quién conozcas.',
        }}
      />
    </>
  );
}
