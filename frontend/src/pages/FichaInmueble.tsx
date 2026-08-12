import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { pedir } from '../lib/api';
import { pesos, distancia, soloDistancia, fechaCorta } from '../lib/formato';
import { fotoDeAncho } from '../lib/fotos';
import { Cargando, EstadoError } from '../components/Estados';
import { IconoMarca } from '../components/Marca';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO } from '../lib/tipos';
import type { RespuestaDetalle } from '../lib/tipos';

/**
 * Una hoja para imprimir o guardar como PDF.
 *
 * No se genera el PDF en el servidor: el navegador ya sabe hacerlo, en el
 * celular tambien, y meter una libreria de PDF al servidor gratuito seria
 * pagar peso y memoria por algo que ya viene puesto. La pagina se abre, sale
 * el dialogo de imprimir y ahi se elige "Guardar como PDF".
 *
 * Va en su propia direccion y no escondida dentro de la ficha normal, para
 * que el diseno de impresion no tenga que pelear con el de la pantalla.
 */
export function FichaInmueble() {
  const { id = '' } = useParams();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['inmueble', id],
    queryFn: () => pedir<RespuestaDetalle>(`/api/inmuebles/${id}`),
  });

  const listo = data !== undefined;

  useEffect(() => {
    if (!listo) return;
    // Se espera un momento a que la foto cargue: si se abre el dialogo antes,
    // la hoja sale con un hueco donde deberia ir la imagen.
    const t = window.setTimeout(() => window.print(), 800);
    return () => window.clearTimeout(t);
  }, [listo]);

  if (isPending) return <Cargando texto="Preparando la ficha..." />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar la ficha.'}
          alReintentar={() => void refetch()}
        />
      </div>
    );
  }

  const { inmueble, referenciaDePrecio } = data;
  const foto = inmueble.fotos[0]?.url ?? null;
  const direccionCompleta = `${window.location.origin}/inmueble/${inmueble.id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-wrap gap-3 sin-imprimir">
        <button type="button" className="boton-primario" onClick={() => window.print()}>
          Guardar como PDF
        </button>
        <Link to={`/inmueble/${inmueble.id}`} className="boton-suave">
          Volver a la publicación
        </Link>
      </div>

      <p className="mb-4 text-sm text-piedra-600 sin-imprimir">
        Si no se abrió solo, pulsa "Guardar como PDF". En el celular aparece dentro de las opciones
        de imprimir.
      </p>

      <article className="hoja space-y-4 rounded-2xl border border-piedra-200 bg-white p-6">
        <header className="flex items-center justify-between gap-4 border-b border-piedra-200 pb-3">
          <div className="flex items-center gap-2">
            <IconoMarca className="h-9 w-9" />
            <span className="font-titulo text-lg font-bold text-piedra-900">PamploHogar</span>
          </div>
          <p className="text-right text-xs text-piedra-600">
            Ficha generada el {fechaCorta(new Date().toISOString())}
          </p>
        </header>

        <div>
          <p className="text-sm font-semibold text-terracota-700">
            {ETIQUETAS_TIPO[inmueble.tipo]} en {inmueble.barrio}
          </p>
          <h1 className="font-titulo text-2xl font-bold text-piedra-900">{inmueble.titulo}</h1>
          <p className="mt-1 text-3xl font-extrabold text-piedra-900">
            {pesos(inmueble.precio)}
            <span className="text-base font-normal text-piedra-600"> al mes</span>
          </p>
        </div>

        {foto !== null && (
          <img
            src={fotoDeAncho(foto, 900)}
            alt=""
            className="h-64 w-full rounded-xl object-cover"
          />
        )}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { que: 'Habitaciones', cuanto: String(inmueble.habitaciones) },
            { que: inmueble.banos === 1 ? 'Baño' : 'Baños', cuanto: String(inmueble.banos) },
            { que: 'Muebles', cuanto: inmueble.amoblado ? 'Incluidos' : 'Sin muebles' },
            {
              que: 'De la universidad',
              cuanto: distancia(inmueble.distanciaUniversidadKm),
            },
          ].map((d) => (
            <div key={d.que} className="rounded-xl border border-piedra-200 px-3 py-2">
              <dt className="text-xs text-piedra-600">{d.que}</dt>
              <dd className="font-bold text-piedra-900">{d.cuanto}</dd>
            </div>
          ))}
        </dl>

        {referenciaDePrecio !== null && (
          <section className="rounded-xl border border-piedra-300 bg-piedra-50 px-4 py-3">
            <h2 className="text-sm font-bold text-piedra-900">Comparado con lo normal</h2>
            <p className="mt-1 text-sm text-piedra-800">
              Lo típico {referenciaDePrecio.ambito === 'barrio' ? `en ${inmueble.barrio}` : 'en Pamplona'}{' '}
              para algo así es <strong>{pesos(referenciaDePrecio.mediana)}</strong>, según{' '}
              {referenciaDePrecio.muestras} publicaciones parecidas.{' '}
              {referenciaDePrecio.veredicto === 'enLoNormal'
                ? 'Este precio está dentro de lo normal.'
                : `Este está ${Math.abs(referenciaDePrecio.diferenciaPorcentaje)} por ciento ${
                    referenciaDePrecio.veredicto === 'porEncima' ? 'por encima' : 'por debajo'
                  }.`}
            </p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-piedra-900">Sobre este lugar</h2>
          <p className="mt-1 text-sm whitespace-pre-wrap text-piedra-800">{inmueble.descripcion}</p>
        </section>

        {inmueble.servicios.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-piedra-900">Qué incluye</h2>
            <p className="mt-1 text-sm text-piedra-800">
              {inmueble.servicios.map((s) => ETIQUETAS_SERVICIO[s] ?? s).join(', ')}
            </p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-piedra-900">Dónde queda</h2>
          <p className="mt-1 text-sm text-piedra-800">
            {inmueble.direccion}, barrio {inmueble.barrio}. Queda a{' '}
            {soloDistancia(inmueble.distanciaUniversidadKm)} de la Universidad de Pamplona.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold text-piedra-900">Quién lo arrienda</h2>
          <p className="mt-1 text-sm text-piedra-800">
            {inmueble.arrendador.nombre}
            {inmueble.arrendador.totalResenas > 0
              ? `, con ${inmueble.arrendador.calificacionPromedio} de 5 en ${inmueble.arrendador.totalResenas} ${
                  inmueble.arrendador.totalResenas === 1 ? 'reseña' : 'reseñas'
                }.`
              : ', todavía sin reseñas.'}
          </p>
          {/* El celular no se imprime: una hoja se comparte y se deja encima
              de una mesa, y ahi el numero deja de estar protegido. */}
          <p className="mt-1 text-xs text-piedra-600">
            El celular no aparece en esta hoja. Se pide desde la publicación, entrando a la página.
          </p>
        </section>

        <footer className="border-t border-piedra-200 pt-3 text-xs text-piedra-600">
          <p className="break-all">
            Publicación completa, con todas las fotos y el mapa: {direccionCompleta}
          </p>
          <p className="mt-1">
            Los precios cambian. Verifica siempre el inmueble en persona antes de entregar dinero.
          </p>
        </footer>
      </article>
    </div>
  );
}
