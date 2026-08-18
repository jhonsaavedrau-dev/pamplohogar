import type { ReferenciaDePrecio } from '../lib/tipos';
import { pesos } from '../lib/formato';

/*
  El mismo margen que usa el servidor para decidir el veredicto (15%).

  Va repetido a proposito y no viajando en la respuesta: es el ancho de la
  franja gris del dibujo, y si algun dia cambia en el servidor, este numero
  tiene que cambiar con el. Escrito aqui se ve; escondido en un calculo no.
*/
const MARGEN = 0.15;

/**
 * La regla de precios del barrio.
 *
 * El numero solo ("18 por ciento por encima") obliga a hacer la cuenta mental
 * de si eso es mucho o poco. La regla lo muestra: la franja del medio es lo
 * normal, y la marca cae dentro o fuera. Se entiende antes de leer.
 */
function Regla({ precio, mediana }: { precio: number; mediana: number }) {
  // La regla va de la mitad al doble de lo tipico. Mas ancha, todo se amontona
  // en el centro; mas angosta, cualquier precio raro se sale del dibujo.
  const desde = mediana * 0.5;
  const hasta = mediana * 2;
  const aPorcentaje = (valor: number) =>
    Math.min(100, Math.max(0, ((valor - desde) / (hasta - desde)) * 100));

  const izquierdaNormal = aPorcentaje(mediana * (1 - MARGEN));
  const derechaNormal = aPorcentaje(mediana * (1 + MARGEN));
  const dondeCae = aPorcentaje(precio);
  const seSale = precio > hasta;

  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full bg-piedra-200/70">
        {/* La franja de lo normal: lo que se cobra por algo parecido. */}
        <div
          className="absolute inset-y-0 rounded-full bg-verificado-500/35"
          style={{ left: `${izquierdaNormal}%`, width: `${derechaNormal - izquierdaNormal}%` }}
        />

        {/* Lo tipico, la raya del medio. */}
        <div
          className="absolute inset-y-[-3px] w-0.5 rounded bg-piedra-500"
          style={{ left: `${aPorcentaje(mediana)}%` }}
        />

        {/* Este inmueble. El anillo blanco lo despega de la franja. */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-terracota-600 shadow-[0_1px_4px_rgba(36,31,26,0.35)]"
          style={{ left: `${dondeCae}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[0.7rem] font-semibold text-piedra-500">
        <span>{pesos(desde)}</span>
        <span className="text-piedra-700">lo típico {pesos(mediana)}</span>
        <span>{seSale ? `${pesos(hasta)}+` : pesos(hasta)}</span>
      </div>
    </div>
  );
}

/**
 * Le dice al estudiante si le estan cobrando de mas, con un numero y no con
 * una corazonada. Es el corazon de por que existe esta plataforma: sin esto,
 * la unica forma de saber si un precio es justo era preguntarle a alguien.
 */
export function ComparadoConElBarrio({
  referencia,
  barrio,
  precio,
}: {
  referencia: ReferenciaDePrecio | null;
  barrio: string;
  precio: number;
}) {
  if (!referencia) return null;

  const { veredicto, mediana, diferenciaPorcentaje, muestras, ambito } = referencia;
  const donde = ambito === 'barrio' ? `en ${barrio}` : 'en Pamplona';

  const estilos = {
    porEncima: 'border-terracota-200 bg-terracota-50',
    porDebajo: 'border-verificado-100 bg-verificado-50',
    enLoNormal: 'border-piedra-200 bg-white',
  }[veredicto];

  const titulos = {
    porEncima: `Está ${Math.abs(diferenciaPorcentaje)} por ciento por encima de lo normal`,
    porDebajo: `Está ${Math.abs(diferenciaPorcentaje)} por ciento por debajo de lo normal`,
    enLoNormal: 'El precio está dentro de lo normal',
  }[veredicto];

  const coloresTitulo = {
    porEncima: 'text-terracota-700',
    porDebajo: 'text-verificado-700',
    enLoNormal: 'text-piedra-900',
  }[veredicto];

  return (
    <section className={`rounded-2xl border p-4 ${estilos}`}>
      <h2 className={`text-base font-semibold ${coloresTitulo}`}>{titulos}</h2>

      <p className="mt-1.5 text-sm text-piedra-700">
        Lo típico {donde} para algo así es <strong>{pesos(mediana)}</strong>, según{' '}
        {muestras === 1 ? 'una publicación parecida' : `${muestras} publicaciones parecidas`}.
      </p>

      <Regla precio={precio} mediana={mediana} />

      {veredicto === 'porEncima' && (
        <p className="mt-3 text-sm text-piedra-700">
          Eso no quiere decir que sea un abuso: puede estar mejor ubicado, más grande o incluir más
          servicios. Pero ya sabes con qué número negociar.
        </p>
      )}

      {ambito === 'ciudad' && (
        <p className="mt-2 text-xs text-piedra-600">
          Todavía hay pocos inmuebles publicados en {barrio}, así que la comparación es contra toda
          la ciudad.
        </p>
      )}
    </section>
  );
}
