import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { pesos } from '../lib/formato';
import { CENTRO_PAMPLONA } from './coordenadas';
import type { MapaDePrecios, NivelDePrecio } from '../lib/tipos';

/**
 * Los mismos tres colores que usa el resto de la pagina para hablar de
 * precios: verde barato, azul normal, terracota caro. Si aqui significaran
 * otra cosa, el estudiante tendria que aprender dos codigos distintos.
 */
const COLORES: Record<NivelDePrecio, string> = {
  barato: '#1f7a52',
  normal: '#1f6fb2',
  caro: '#d2691e',
};

/**
 * El circulo crece con cuantos inmuebles hay en la zona, no con el precio.
 * Asi se ve de un vistazo donde hay de verdad de donde escoger.
 */
const radioDeZona = (inmuebles: number): number => 22 + Math.min(inmuebles, 12) * 3;

export function MapaDeCalor({ datos }: { datos: MapaDePrecios }) {
  return (
    <div className="h-[26rem] overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[CENTRO_PAMPLONA.lat, CENTRO_PAMPLONA.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {datos.zonas.map((z) => (
          <CircleMarker
            key={`zona-${z.barrio}`}
            center={[z.lat, z.lng]}
            radius={radioDeZona(z.inmuebles)}
            pathOptions={{
              color: COLORES[z.nivel],
              fillColor: COLORES[z.nivel],
              fillOpacity: 0.18,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{z.barrio}</strong>: {pesos(z.mediana)}
            </Tooltip>
            <Popup>
              <strong>{z.barrio}</strong>
              <br />
              Lo típico aquí: {pesos(z.mediana)}
              <br />
              {z.inmuebles} {z.inmuebles === 1 ? 'publicación' : 'publicaciones'}
              <br />
              {z.diferenciaPorcentaje === 0
                ? 'Igual que el resto de la ciudad'
                : `${Math.abs(z.diferenciaPorcentaje)} por ciento ${
                    z.diferenciaPorcentaje > 0 ? 'por encima' : 'por debajo'
                  } del promedio de Pamplona`}
            </Popup>
          </CircleMarker>
        ))}

        {datos.puntos.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{
              color: '#ffffff',
              fillColor: COLORES[p.nivel],
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{p.titulo}</strong>
              <br />
              {p.barrio} - {pesos(p.precio)}
              <br />
              <Link to={`/inmueble/${p.id}`}>Ver la publicación</Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
