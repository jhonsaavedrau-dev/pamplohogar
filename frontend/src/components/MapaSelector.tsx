import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const iconoSeleccion = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 64 64" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6 6 27v29a3 3 0 0 0 3 3h46a3 3 0 0 0 3-3V27L32 6Z" fill="#1F6FB2" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="32" cy="36" r="6" fill="#FFFFFF"/>
    </svg>`,
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});

function CapturadorDeClic({ alElegir }: { alElegir: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(evento) {
      alElegir(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

interface Props {
  lat: number;
  lng: number;
  alElegir: (lat: number, lng: number) => void;
}

export function MapaSelector({ lat, lng, alElegir }: Props) {
  return (
    <div className="h-64 overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CapturadorDeClic alElegir={alElegir} />
        <Marker
          position={[lat, lng]}
          icon={iconoSeleccion}
          draggable
          eventHandlers={{
            dragend: (evento) => {
              const posicion = evento.target.getLatLng();
              alElegir(posicion.lat, posicion.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
