import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import type { TipoInmueble } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO } from '../lib/tipos';
import { fechaCorta, pesos } from '../lib/formato';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../components/Estados';

interface Filtros {
  q: string | null;
  tipo: TipoInmueble | null;
  barrio: string | null;
  precioMin: number | null;
  precioMax: number | null;
  habitaciones: number | null;
  amoblado: boolean | null;
  servicios: string[];
}

interface Busqueda {
  id: string;
  nombre: string;
  avisarPorCorreo: boolean;
  creadoEn: string;
  ultimoAvisoEn: string | null;
  filtros: Filtros;
  coincidencias: number;
}

/** Rearma la dirección del buscador para volver a ver esos resultados. */
function enlaceDe(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.barrio) p.set('barrio', f.barrio);
  if (f.precioMin !== null) p.set('precioMin', String(f.precioMin));
  if (f.precioMax !== null) p.set('precioMax', String(f.precioMax));
  if (f.habitaciones !== null) p.set('habitaciones', String(f.habitaciones));
  if (f.amoblado === true) p.set('amoblado', 'true');
  if (f.servicios.length > 0) p.set('servicios', f.servicios.join(','));
  return `/?${p.toString()}`;
}

function resumenDe(f: Filtros): string[] {
  const partes: string[] = [];
  if (f.tipo) partes.push(ETIQUETAS_TIPO[f.tipo]);
  if (f.barrio) partes.push(f.barrio);
  if (f.precioMin !== null && f.precioMax !== null) {
    partes.push(`${pesos(f.precioMin)} a ${pesos(f.precioMax)}`);
  } else if (f.precioMax !== null) {
    partes.push(`hasta ${pesos(f.precioMax)}`);
  } else if (f.precioMin !== null) {
    partes.push(`desde ${pesos(f.precioMin)}`);
  }
  if (f.habitaciones !== null) partes.push(`${f.habitaciones}+ habitaciones`);
  if (f.amoblado === true) partes.push('Amoblado');
  f.servicios.forEach((s) => partes.push(ETIQUETAS_SERVICIO[s] ?? s));
  if (f.q) partes.push(`"${f.q}"`);
  return partes;
}

export function BusquedasGuardadas() {
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['busquedas'],
    queryFn: () => pedir<{ busquedas: Busqueda[] }>('/api/busquedas'),
  });

  const refrescar = () => void clienteQuery.invalidateQueries({ queryKey: ['busquedas'] });

  const alternarAviso = useMutation({
    mutationFn: ({ id, avisar }: { id: string; avisar: boolean }) =>
      pedir(`/api/busquedas/${id}`, { metodo: 'PATCH', cuerpo: { avisarPorCorreo: avisar } }),
    onSuccess: (_r, v) => {
      setMensaje(v.avisar ? 'Te avisaremos por correo.' : 'Ya no te avisaremos de esta búsqueda.');
      refrescar();
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos cambiarlo.'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => pedir(`/api/busquedas/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      setMensaje('Búsqueda eliminada.');
      refrescar();
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos eliminarla.'),
  });

  return (
    <div className="contenedor-app py-8">
      <h1 className="titular">Mis búsquedas</h1>
      <p className="mt-1 mb-6 text-sm text-piedra-600">
        Te avisamos por correo apenas aparezca algo que encaje. Al empezar el semestre los buenos se
        van en horas.
      </p>

      {mensaje && (
        <div className="mb-4">
          <Aviso tipo={alternarAviso.isError || eliminar.isError ? 'error' : 'exito'}>
            {mensaje}
          </Aviso>
        </div>
      )}

      {isLoading && <Cargando texto="Cargando tus búsquedas..." />}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar tus búsquedas.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data &&
        (data.busquedas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no has guardado ninguna"
            descripcion="Pon los filtros que te sirven en el buscador y pulsa Avisarme si aparece algo. Nosotros te escribimos cuando salga."
            accion={
              <Link to="/" className="boton-primario mt-2">
                Ir a buscar
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.busquedas.map((b) => {
              const partes = resumenDe(b.filtros);
              return (
                <li key={b.id} className="tarjeta p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={enlaceDe(b.filtros)}
                        className="text-lg font-bold text-piedra-900 hover:text-terracota-600"
                      >
                        {b.nombre}
                      </Link>

                      <p className="mt-1 text-sm text-piedra-600">
                        <strong className="font-semibold text-piedra-900">
                          {b.coincidencias}
                        </strong>{' '}
                        {b.coincidencias === 1 ? 'inmueble encaja' : 'inmuebles encajan'} ahora
                      </p>

                      {partes.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {partes.map((p) => (
                            <span key={p} className="chip">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-piedra-600">
                        Guardada el {fechaCorta(b.creadoEn)}
                        {b.ultimoAvisoEn && ` · último aviso el ${fechaCorta(b.ultimoAvisoEn)}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-piedra-700">
                        <input
                          type="checkbox"
                          className="h-6 w-6 shrink-0 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
                          checked={b.avisarPorCorreo}
                          disabled={alternarAviso.isPending}
                          onChange={(e) =>
                            alternarAviso.mutate({ id: b.id, avisar: e.target.checked })
                          }
                        />
                        Avisarme
                      </label>

                      <div className="flex gap-2">
                        <Link to={enlaceDe(b.filtros)} className="boton-suave text-sm">
                          Ver
                        </Link>
                        <button
                          type="button"
                          className="boton-suave text-sm text-terracota-700"
                          disabled={eliminar.isPending}
                          onClick={() => {
                            if (window.confirm(`Eliminar la búsqueda "${b.nombre}"?`)) {
                              eliminar.mutate(b.id);
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
