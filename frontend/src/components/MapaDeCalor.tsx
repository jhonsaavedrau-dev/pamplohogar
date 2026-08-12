import { useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, Tooltip, ZoomControl } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { pesos } from '../lib/formato';
import { CENTRO_PAMPLONA } from './coordenadas';
import {
  BotonDeVista,
  CapaDelMapa,
  CapaQuieta,
  esDeTocar,
  etiquetaDePrecio,
  useMapaQuietoHastaQueLoToquen,
} from './baseMapa';
import type { VistaDelMapa } from './baseMapa';
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
const radioDeZona = (inmuebles: number): number => 26 + Math.min(inmuebles, 12) * 4;

/** En miles, que es como se habla de arriendos: "trescientos veinte". */
const enMiles = (valor: number): string => `$${Math.round(valor / 1000)}k`;

function ControlDeGestos({ enCelular }: { enCelular: boolean }) {
  const { despierto, despertar } = useMapaQuietoHastaQueLoToquen(enCelular);
  if (despierto) return null;
  return <CapaQuieta alDespertar={despertar} />;
}

export function MapaDeCalor({ datos }: { datos: MapaDePrecios }) {
  const [vista, setVista] = useState<VistaDelMapa>('mapa');
  const [enCelular] = useState(esDeTocar);

  return (
    <div className="relative h-[28rem] overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[CENTRO_PAMPLONA.lat, CENTRO_PAMPLONA.lng]}
        zoom={14}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <CapaDelMapa vista={vista} />
        <ZoomControl position="bottomleft" />

        {datos.zonas.map((z) => (
          <CircleMarker
            key={`zona-${z.barrio}`}
            center={[z.lat, z.lng]}
            radius={radioDeZona(z.inmuebles)}
            pathOptions={{
              color: COLORES[z.nivel],
              fillColor: COLORES[z.nivel],
              fillOpacity: 0.2,
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

        {/*
          Cada publicacion lleva su precio escrito encima. Antes eran puntos de
          colores y habia que ir tocando uno por uno para saber cuanto valia
          cada cosa: el mapa se veia bonito y no respondia la pregunta.
        */}
        {datos.puntos.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={etiquetaDePrecio(enMiles(p.precio), COLORES[p.nivel])}
          >
            <Popup>
              <strong>{p.titulo}</strong>
              <br />
              {p.barrio} - {pesos(p.precio)}
              <br />
              <Link to={`/inmueble/${p.id}`}>Ver la publicación</Link>
            </Popup>
          </Marker>
        ))}

        <ControlDeGestos enCelular={enCelular} />
      </MapContainer>

      <BotonDeVista vista={vista} alCambiar={setVista} />
    </div>
  );
}
