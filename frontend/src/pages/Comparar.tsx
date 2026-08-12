import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useComparador } from '../lib/comparador';
import type { RespuestaDetalle } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO, SERVICIOS_DISPONIBLES } from '../lib/tipos';
import { distancia, pesos } from '../lib/formato';
import { Estrellas } from '../components/Estrellas';
import { FotoInmueble } from '../components/FotoInmueble';
import { Aviso, Cargando, EstadoVacio } from '../components/Estados';

export function Comparar() {
  const { ids, quitar, limpiar } = useComparador();

  const consultas = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['inmueble', id],
      queryFn: () => pedir<RespuestaDetalle>(`/api/inmuebles/${id}`),
    })),
  });

  if (ids.length === 0) {
    return (
      <div className="contenedor-app py-10">
        {/* El titulo va aunque no haya nada que comparar: toda pantalla
            necesita uno para que un lector de pantalla sepa donde esta. */}
        <h1 className="sr-only">Comparar inmuebles</h1>
        <EstadoVacio
          titulo="No has elegido nada para comparar"
          descripcion="Marca la casilla Comparar en los inmuebles que te interesen y vuelve aquí para verlos lado a lado."
          accion={
            <Link to="/" className="boton-primario mt-2">
              Buscar vivienda
            </Link>
          }
        />
      </div>
    );
  }

  if (consultas.some((c) => c.isPending)) return <Cargando texto="Trayendo los inmuebles..." />;

  const inmuebles = consultas
    .map((c) => c.data?.inmueble)
    .filter((i): i is NonNullable<typeof i> => i !== undefined);

  // Si alguno no se pudo traer se avisa, en vez de hacerlo desaparecer de la tabla
  // y dejar al estudiante comparando menos inmuebles de los que eligio.
  const fallidos = consultas.filter((c) => c.isError).length;

  if (inmuebles.length === 0) {
    return (
      <div className="contenedor-app py-10">
        <h1 className="sr-only">Comparar inmuebles</h1>
        <EstadoVacio
          titulo="Esos inmuebles ya no están"
          descripcion="Puede que los hayan retirado mientras los comparabas."
          accion={
            <button type="button" onClick={limpiar} className="boton-primario mt-2">
              Empezar de nuevo
            </button>
          }
        />
      </div>
    );
  }

  const masBarato = Math.min(...inmuebles.map((i) => i.precio));
  const masCerca = Math.min(...inmuebles.map((i) => i.distanciaUniversidadKm));
  const mejorCalificado = Math.max(...inmuebles.map((i) => i.arrendador.calificacionPromedio));

  // Solo se muestran los servicios que al menos uno tiene, para no llenar
  // la tabla de filas vacias.
  const serviciosRelevantes = SERVICIOS_DISPONIBLES.filter((s) =>
    inmuebles.some((i) => i.servicios.includes(s)),
  );

  const Destacado = ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-full bg-confianza-50 px-2 py-0.5 text-xs font-bold text-confianza-700">
      {children}
    </span>
  );

  return (
    <div className="contenedor-app py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="titular">Comparar inmuebles</h1>
          <p className="mt-1 text-sm text-piedra-600">
            Lo mejor de cada fila aparece resaltado en azul.
          </p>
        </div>
        <button type="button" onClick={limpiar} className="boton-suave">
          Limpiar comparacion
        </button>
      </div>

      {fallidos > 0 && (
        <div className="mb-4">
          <Aviso tipo="error">
            {fallidos === 1
              ? 'Uno de los inmuebles que elegiste ya no está disponible y no aparece en la tabla.'
              : `${fallidos} de los inmuebles que elegiste ya no están disponibles y no aparecen en la tabla.`}
          </Aviso>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 p-2 text-left align-bottom text-piedra-600" scope="col">
                <span className="sr-only">Caracteristica</span>
              </th>
              {inmuebles.map((i) => (
                <th key={i.id} className="p-2 align-bottom" scope="col">
                  <div className="space-y-2 text-left">
                    <Link to={`/inmueble/${i.id}`} className="block">
                      <div className="h-24 overflow-hidden rounded-xl bg-piedra-100">
                        {i.fotos[0] ? (
                          <FotoInmueble
                            url={i.fotos[0].url}
                            alt={i.titulo}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs text-piedra-400">
                            Sin fotos
                          </div>
                        )}
                      </div>
                      <span className="mt-2 block leading-snug font-bold text-piedra-900">
                        {i.titulo}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => quitar(i.id)}
                      className="text-xs font-semibold text-piedra-600 underline"
                    >
                      Quitar
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="align-top">
            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Precio
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2">
                  <span className="font-extrabold text-terracota-600">{pesos(i.precio)}</span>
                  {i.precio === masBarato && inmuebles.length > 1 && (
                    <span className="mt-1 block">
                      <Destacado>El mas barato</Destacado>
                    </span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Distancia
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {distancia(i.distanciaUniversidadKm)}
                  {i.distanciaUniversidadKm === masCerca && inmuebles.length > 1 && (
                    <span className="mt-1 block">
                      <Destacado>El mas cerca</Destacado>
                    </span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Tipo
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {ETIQUETAS_TIPO[i.tipo]}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Barrio
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {i.barrio}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Habitaciones
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {i.habitaciones}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Baños
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {i.banos}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Amoblado
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  {i.amoblado ? 'Si' : 'No'}
                </td>
              ))}
            </tr>

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                Arrendador
              </th>
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2 text-piedra-800">
                  <span className="block">{i.arrendador.nombre}</span>
                  <Estrellas
                    valor={i.arrendador.calificacionPromedio}
                    total={i.arrendador.totalResenas}
                  />
                  {i.arrendador.calificacionPromedio === mejorCalificado &&
                    mejorCalificado > 0 &&
                    inmuebles.length > 1 && (
                      <span className="mt-1 block">
                        <Destacado>Mejor calificado</Destacado>
                      </span>
                    )}
                </td>
              ))}
            </tr>

            {serviciosRelevantes.map((servicio) => (
              <tr key={servicio} className="border-t border-piedra-200">
                <th scope="row" className="p-2 text-left font-semibold text-piedra-600">
                  {ETIQUETAS_SERVICIO[servicio]}
                </th>
                {inmuebles.map((i) => (
                  <td key={i.id} className="p-2">
                    {i.servicios.includes(servicio) ? (
                      <span className="font-bold text-confianza-600">Si</span>
                    ) : (
                      <span className="text-piedra-400">No</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            <tr className="border-t border-piedra-200">
              <th scope="row" className="p-2" />
              {inmuebles.map((i) => (
                <td key={i.id} className="p-2">
                  <Link to={`/inmueble/${i.id}`} className="boton-primario w-full text-sm">
                    Ver y contactar
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
