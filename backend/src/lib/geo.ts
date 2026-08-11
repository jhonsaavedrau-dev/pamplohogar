/** Coordenadas de la Ciudadela Universitaria de la Universidad de Pamplona. */
export const UNIVERSIDAD_PAMPLONA = { lat: 7.3697, lng: -72.6516 } as const;

const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/** Distancia en kilometros entre dos puntos, formula de Haversine. */
export function distanciaKm(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const dLat = aRadianes(latB - latA);
  const dLng = aRadianes(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(latA)) * Math.cos(aRadianes(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Distancia en kilometros desde un punto hasta la Universidad de Pamplona. */
export function distanciaAUniversidad(lat: number, lng: number): number {
  return distanciaKm(lat, lng, UNIVERSIDAD_PAMPLONA.lat, UNIVERSIDAD_PAMPLONA.lng);
}
