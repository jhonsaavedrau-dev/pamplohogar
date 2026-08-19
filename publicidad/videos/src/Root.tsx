import { Composition } from 'remotion';
import { HistoriaSinConocidos } from './HistoriaSinConocidos';
import { TarjetaCierre, TarjetaFuncion, TarjetaGiro } from './Tarjetas';
import { VIDEO } from './marca';

/*
  El catalogo de videos. Cada Composition es un video que se puede renderizar
  por su nombre:

    npx remotion render HistoriaSinConocidos
*/
export function Root() {
  return (
    <>
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
    </>
  );
}
