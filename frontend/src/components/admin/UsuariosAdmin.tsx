import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { useSesion } from '../../lib/sesion';
import type { Rol, UsuarioAdmin } from '../../lib/tipos';
import { fechaCorta } from '../../lib/formato';
import { Aviso, Cargando, EstadoVacio, EstadoError } from '../Estados';

interface Respuesta {
  total: number;
  pagina: number;
  totalPaginas: number;
  usuarios: UsuarioAdmin[];
}

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'ESTUDIANTE', etiqueta: 'Estudiantes' },
  { valor: 'ARRENDADOR', etiqueta: 'Arrendadores' },
  { valor: 'ADMIN', etiqueta: 'Admins' },
] as const;

const ETIQUETA_ROL: Record<Rol, string> = {
  ESTUDIANTE: 'Estudiante',
  ARRENDADOR: 'Arrendador',
  ADMIN: 'Administrador',
};

export function UsuariosAdmin() {
  const { usuario: yo } = useSesion();
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState<(typeof FILTROS)[number]['valor']>('todos');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const clienteQuery = useQueryClient();

  const parametros = new URLSearchParams({ rol, pagina: String(pagina) });
  if (busqueda.trim() !== '') parametros.set('q', busqueda.trim());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'usuarios', parametros.toString()],
    queryFn: () => pedir<Respuesta>(`/api/admin/usuarios?${parametros.toString()}`),
  });

  const cambiarRol = useMutation({
    mutationFn: ({ id, nuevoRol }: { id: string; nuevoRol: 'ESTUDIANTE' | 'ARRENDADOR' }) =>
      pedir(`/api/admin/usuarios/${id}/rol`, { metodo: 'PATCH', cuerpo: { rol: nuevoRol } }),
    onSuccess: () => {
      setMensaje('Rol actualizado.');
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos cambiar el rol.'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => pedir(`/api/admin/usuarios/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      setMensaje('Cuenta eliminada junto con lo que habia publicado.');
      void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
      void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos eliminar la cuenta.'),
  });

  return (
    <div className="space-y-4">
      {mensaje && (
        <Aviso tipo={cambiarRol.isError || eliminar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>
      )}

      <div className="flex flex-col gap-2">
        <input
          type="search"
          className="campo"
          placeholder="Busca por nombre o correo"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          aria-label="Buscar usuarios"
        />
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => {
                setRol(f.valor);
                setPagina(1);
              }}
              aria-pressed={rol === f.valor}
              className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                rol === f.valor
                  ? 'border-confianza-500 bg-confianza-500 text-white'
                  : 'border-piedra-200 bg-white text-piedra-800'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Cargando texto="Buscando usuarios..." />}

      {isError && (
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar los usuarios.'}
          alReintentar={() => void refetch()}
        />
      )}

      {data && (
        <>
          <p className="text-sm text-piedra-600">
            {data.total} {data.total === 1 ? 'persona' : 'personas'}
          </p>

          {data.usuarios.length === 0 ? (
            <EstadoVacio
              titulo="Nadie coincide"
              descripcion="Con esa busqueda no aparece ninguna cuenta. Prueba con otro nombre o correo."
            />
          ) : (
            <ul className="space-y-3">
              {data.usuarios.map((u) => {
                const esYo = u.id === yo?.id;
                const esAdmin = u.rol === 'ADMIN';
                return (
                  <li key={u.id} className="tarjeta p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              esAdmin
                                ? 'bg-terracota-100 text-terracota-700'
                                : 'bg-piedra-100 text-piedra-600'
                            }`}
                          >
                            {ETIQUETA_ROL[u.rol]}
                          </span>
                          {esYo && (
                            <span className="rounded-full bg-confianza-100 px-3 py-1 text-xs font-bold text-confianza-700">
                              Tu cuenta
                            </span>
                          )}
                        </div>

                        <p className="mt-2 font-bold text-piedra-900">{u.nombre}</p>
                        <p className="text-sm break-all text-piedra-600">{u.email}</p>
                        {u.telefono && <p className="text-sm text-piedra-600">{u.telefono}</p>}
                        <p className="mt-1 text-xs text-piedra-600">
                          Desde {fechaCorta(u.creadoEn)} · {u.inmuebles}{' '}
                          {u.inmuebles === 1 ? 'inmueble' : 'inmuebles'} · {u.resenas}{' '}
                          {u.resenas === 1 ? 'reseña' : 'reseñas'}
                        </p>
                      </div>

                      {!esYo && !esAdmin && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="boton-suave flex-1 text-sm lg:flex-none"
                            disabled={cambiarRol.isPending}
                            onClick={() =>
                              cambiarRol.mutate({
                                id: u.id,
                                nuevoRol: u.rol === 'ESTUDIANTE' ? 'ARRENDADOR' : 'ESTUDIANTE',
                              })
                            }
                          >
                            {u.rol === 'ESTUDIANTE' ? 'Hacer arrendador' : 'Hacer estudiante'}
                          </button>
                          <button
                            type="button"
                            className="boton-suave flex-1 text-sm text-terracota-700 lg:flex-none"
                            disabled={eliminar.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Eliminar la cuenta de ${u.nombre}? Se borran también sus ${u.inmuebles} inmuebles. No se puede deshacer.`,
                                )
                              ) {
                                eliminar.mutate(u.id);
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {data.totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="boton-suave"
                disabled={data.pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="text-sm text-piedra-600">
                Pagina {data.pagina} de {data.totalPaginas}
              </span>
              <button
                type="button"
                className="boton-suave"
                disabled={data.pagina >= data.totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      <p className="rounded-xl bg-piedra-100 px-4 py-3 text-xs text-piedra-600">
        Nombrar administradores no se puede hacer desde aquí, a propósito. Se hace desde el
        proyecto con el comando <code className="font-mono">npm run hacer-admin</code>. Así, aunque
        alguien entrara a una cuenta de administrador, no podria crear mas.
      </p>
    </div>
  );
}
