import { Composition } from 'remotion';
import { HistoriaSinConocidos } from './HistoriaSinConocidos';
import { DURACION_TOTAL, VideoCompleto } from './VideoCompleto';
import { DURACION_ARRENDADORES, VideoArrendadores } from './VideoArrendadores';
import { DURACION_PRECIO, VideoPrecio } from './VideoPrecio';
import { DURACION_NOCHE, VideoNoche } from './VideoNoche';
import { DURACION_ANTES, VideoAntesYDespues } from './VideoAntesYDespues';
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

      {/*
        Los dos cortos. No son recortes del largo: cada uno entra por otro lado
        y le habla a otra persona.

          VideoPrecio        15 s   al estudiante, por la plata
          VideoArrendadores  20 s   al que tiene la habitacion desocupada
      */}
      <Composition
        id="VideoPrecio"
        component={VideoPrecio}
        durationInFrames={DURACION_PRECIO}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoArrendadores"
        component={VideoArrendadores}
        durationInFrames={DURACION_ARRENDADORES}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      {/*
        Y los dos que cambian de estilo, no solo de enfoque.

          VideoNoche         18 s   fondo oscuro, puro texto, ni un aparato
          VideoAntesYDespues 20 s   ocho segundos sin color y un barrido
      */}
      <Composition
        id="VideoNoche"
        component={VideoNoche}
        durationInFrames={DURACION_NOCHE}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoAntesYDespues"
        component={VideoAntesYDespues}
        durationInFrames={DURACION_ANTES}
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
