import { Composition } from 'remotion';
import { HistoriaSinConocidos } from './HistoriaSinConocidos';
import { DURACION_TOTAL, VideoCompleto } from './VideoCompleto';
import { DURACION_ARRENDADORES, VideoArrendadores } from './VideoArrendadores';
import { DURACION_PRECIO, VideoPrecio } from './VideoPrecio';
import { DURACION_NOCHE, VideoNoche } from './VideoNoche';
import { DURACION_ANTES, VideoAntesYDespues } from './VideoAntesYDespues';
import { DURACION_RECIBO, VideoRecibo } from './VideoRecibo';
import { DURACION_SCROLL, VideoUnSoloScroll } from './VideoUnSoloScroll';
import { DURACION_VIDEO_MAPA, VideoMapa } from './VideoMapa';
import { DURACION_TARJETAS, VideoTarjetas } from './VideoTarjetas';
import { DURACION_CUENTA, VideoCuenta } from './VideoCuenta';
import { DURACION_VIDEO_CARTEL, VideoCartel } from './VideoCartel';
import { DURACION_LLAMADAS, VideoLlamadas } from './VideoLlamadas';
import { DURACION_VIDEO_CALENDARIO, VideoCalendario } from './VideoCalendario';
import { DURACION_FICHA, VideoFicha } from './VideoFicha';
import { DURACION_CONTRASTE, VideoContraste } from './VideoContraste';
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


      {/*
        Los diez de la segunda tanda. Cinco para el que busca y cinco para el
        que arrienda, y cada uno con su propio aspecto: hay tirilla de recibo,
        una sola toma sin cortes, mapa a pantalla completa, baraja de cartas,
        cifras sobre naranja, cartel de poste, lista de llamadas, calendario,
        formulario con sello y pantalla partida.
      */}
      <Composition
        id="VideoRecibo"
        component={VideoRecibo}
        durationInFrames={DURACION_RECIBO}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoUnSoloScroll"
        component={VideoUnSoloScroll}
        durationInFrames={DURACION_SCROLL}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoMapa"
        component={VideoMapa}
        durationInFrames={DURACION_VIDEO_MAPA}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoTarjetas"
        component={VideoTarjetas}
        durationInFrames={DURACION_TARJETAS}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoCuenta"
        component={VideoCuenta}
        durationInFrames={DURACION_CUENTA}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoCartel"
        component={VideoCartel}
        durationInFrames={DURACION_VIDEO_CARTEL}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoLlamadas"
        component={VideoLlamadas}
        durationInFrames={DURACION_LLAMADAS}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoCalendario"
        component={VideoCalendario}
        durationInFrames={DURACION_VIDEO_CALENDARIO}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoFicha"
        component={VideoFicha}
        durationInFrames={DURACION_FICHA}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />

      <Composition
        id="VideoContraste"
        component={VideoContraste}
        durationInFrames={DURACION_CONTRASTE}
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
