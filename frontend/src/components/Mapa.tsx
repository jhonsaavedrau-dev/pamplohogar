import { useState } from 'react';
import { MapContainer, Marker, Popup, ZoomControl } from 'react-leaflet';
import {
  BotonDeVista,
  CapaDelMapa,
  CapaQuieta,
  esDeTocar,
  gota,
  useMapaQuietoHastaQueLoToquen,
} from './baseMapa';
import type { VistaDelMapa } from './baseMapa';

const iconoCasa = gota('#D2691E');

/** Va dentro del mapa porque necesita hablar con el, no puede ir fuera. */
function ControlDeGestos({ enCelular }: { enCelular: boolean }) {
  const { despierto, despertar } = useMapaQuietoHastaQueLoToquen(enCelular);
  if (despierto) return null;
  return <CapaQuieta alDespertar={despertar} />;
}

interface Props {
  lat: number;
  lng: number;
  titulo: string;
  direccion: string;
}

export function Mapa({ lat, lng, titulo, direccion }: Props) {
  const [vista, setVista] = useState<VistaDelMapa>('mapa');
  const [enCelular] = useState(esDeTocar);

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <CapaDelMapa vista={vista} />
        {/* Abajo a la izquierda, donde el pulgar llega sin tapar el inmueble. */}
        <ZoomControl position="bottomleft" />
        <Marker position={[lat, lng]} icon={iconoCasa}>
          <Popup>
            <strong>{titulo}</strong>
            <br />
            {direccion}
          </Popup>
        </Marker>
        <ControlDeGestos enCelular={enCelular} />
      </MapContainer>

      <BotonDeVista vista={vista} alCambiar={setVista} />
    </div>
  );
}
