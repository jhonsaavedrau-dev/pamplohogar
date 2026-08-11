import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

/**
 * Leaflet busca sus iconos por ruta relativa y eso se rompe al empaquetar.
 * Definimos un marcador propio en SVG para no depender de esos archivos.
 */
const iconoCasa = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6 6 27v29a3 3 0 0 0 3 3h46a3 3 0 0 0 3-3V27L32 6Z" fill="#D2691E" stroke="#FFF7F0" stroke-width="3"/>
      <circle cx="32" cy="36" r="6" fill="#FFF7F0"/>
    </svg>`,
  iconSize: [38, 38],
  iconAnchor: [19, 36],
  popupAnchor: [0, -34],
});

interface Props {
  lat: number;
  lng: number;
  titulo: string;
  direccion: string;
}

export function Mapa({ lat, lng, titulo, direccion }: Props) {
  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={iconoCasa}>
          <Popup>
            <strong>{titulo}</strong>
            <br />
            {direccion}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
