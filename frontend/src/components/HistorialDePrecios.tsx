import type { CambioDePrecio } from '../lib/tipos';
import { fechaCorta, pesos } from '../lib/formato';

interface Props {
  cambios: CambioDePrecio[];
  precioActual: number;
}

export function HistorialDePrecios({ cambios, precioActual }: Props) {
  if (cambios.length === 0) return null;

  const primerPrecio = cambios[0].precioAnterior;
  const variacion = precioActual - primerPrecio;
  const porcentaje = Math.round((variacion / primerPrecio) * 100);
  const subio = variacion > 0;

  return (
    <section>
      <h2 className="titulo-seccion">Cómo ha cambiado el precio</h2>

      {variacion !== 0 && (
        <p
          className={`mb-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            subio
              ? 'border-terracota-200 bg-terracota-50 text-terracota-700'
              : 'border-confianza-100 bg-confianza-50 text-confianza-700'
          }`}
        >
          {subio ? 'Subio' : 'Bajo'} {Math.abs(porcentaje)} por ciento desde que se publicó:{' '}
          de {pesos(primerPrecio)} a {pesos(precioActual)}.
        </p>
      )}

      <ol className="space-y-2">
        {cambios.map((c, i) => {
          const diferencia = c.precioNuevo - c.precioAnterior;
          return (
            <li
              key={`${c.creadoEn}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-piedra-100 px-4 py-3 text-sm"
            >
              <span className="text-piedra-600">{fechaCorta(c.creadoEn)}</span>
              <span className="text-piedra-800">
                {pesos(c.precioAnterior)} &rarr;{' '}
                <strong className={diferencia > 0 ? 'text-terracota-700' : 'text-confianza-700'}>
                  {pesos(c.precioNuevo)}
                </strong>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-2 text-xs text-piedra-600">
        Mostramos esto para que puedas negociar con información y no de memoria.
      </p>
    </section>
  );
}
