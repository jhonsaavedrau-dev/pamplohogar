import { useState } from 'react';
import { MapContainer, Marker, ZoomControl, useMapEvents } from 'react-leaflet';
import { BotonDeVista, CapaDelMapa, gota } from './baseMapa';
import type { VistaDelMapa } from './baseMapa';

const iconoSeleccion = gota('#1F6FB2', 48);

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
  const [vista, setVista] = useState<VistaDelMapa>('mapa');

  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border border-piedra-200">
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <CapaDelMapa vista={vista} />
        <ZoomControl position="bottomleft" />
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

      <BotonDeVista vista={vista} alCambiar={setVista} />

      {/*
        Aqui el mapa SI se puede arrastrar de una en el celular: la persona
        vino a poner un punto, arrastrar es lo que tiene que hacer.
      */}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-piedra-700 shadow-[var(--shadow-suave)]">
        Toca el mapa o arrastra el pin
      </p>
    </div>
  );
}
