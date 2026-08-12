import type { ReferenciaDePrecio } from '../lib/tipos';
import { pesos } from '../lib/formato';

/**
 * Le dice al estudiante si le estan cobrando de mas, con un numero y no con
 * una corazonada. Es el corazon de por que existe esta plataforma: sin esto,
 * la unica forma de saber si un precio es justo era preguntarle a alguien.
 */
export function ComparadoConElBarrio({
  referencia,
  barrio,
}: {
  referencia: ReferenciaDePrecio | null;
  barrio: string;
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

      {veredicto === 'porEncima' && (
        <p className="mt-2 text-sm text-piedra-700">
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
