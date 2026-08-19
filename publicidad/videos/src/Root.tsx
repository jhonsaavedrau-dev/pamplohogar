import { Composition } from 'remotion';
import { HistoriaSinConocidos } from './HistoriaSinConocidos';
import { VIDEO } from './marca';

/*
  El catalogo de videos. Cada Composition es un video que se puede renderizar
  por su nombre:

    npx remotion render HistoriaSinConocidos
*/
export function Root() {
  return (
    <Composition
      id="HistoriaSinConocidos"
      component={HistoriaSinConocidos}
      durationInFrames={VIDEO.fps * VIDEO.segundos}
      fps={VIDEO.fps}
      width={VIDEO.ancho}
      height={VIDEO.alto}
    />
  );
}
