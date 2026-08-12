const formateadorPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function pesos(valor: number): string {
  return formateadorPesos.format(valor).replace(/\s/g, ' ');
}

export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Solo la medida, para cuando la frase ya dice de donde. */
export function soloDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} metros`;
  return `${km.toFixed(1)} kilómetros`;
}

export function distancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m de la Unipamplona`;
  return `${km.toFixed(1)} km de la Unipamplona`;
}
