import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { RespuestaContacto, RespuestaDetalle } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO } from '../lib/tipos';
import { distancia, fechaCorta, pesos } from '../lib/formato';
import { Carrusel } from '../components/Carrusel';
import { Mapa } from '../components/Mapa';
import { Estrellas, SelectorEstrellas } from '../components/Estrellas';
import { Aviso, Cargando, EstadoError } from '../components/Estados';

export function DetalleInmueble() {
  const { id = '' } = useParams();
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [contacto, setContacto] = useState<RespuestaContacto | null>(null);
  const [errorContacto, setErrorContacto] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [mensajeResena, setMensajeResena] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inmueble', id],
    queryFn: () => pedir<RespuestaDetalle>(`/api/inmuebles/${id}`),
    enabled: id !== '',
  });

  const favorito = useMutation({
    mutationFn: async (activar: boolean) => {
      await pedir(`/api/favoritos/${id}`, { metodo: activar ? 'POST' : 'DELETE' });
      return activar;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['inmueble', id] });
      void clienteQuery.invalidateQueries({ queryKey: ['favoritos'] });
    },
  });

  const pedirContacto = useMutation({
    mutationFn: () => pedir<RespuestaContacto>(`/api/inmuebles/${id}/contacto`, { metodo: 'POST' }),
    onSuccess: (datos) => {
      setErrorContacto('');
      setContacto(datos);
    },
    onError: (e) => {
      setErrorContacto(e instanceof Error ? e.message : 'No pudimos mostrar el contacto.');
    },
  });

  const enviarResena = useMutation({
    mutationFn: () =>
      pedir('/api/resenas', {
        metodo: 'POST',
        cuerpo: { inmuebleId: id, calificacion, comentario },
      }),
    onSuccess: () => {
      setMensajeResena('Gracias, tu resena quedo publicada.');
      setComentario('');
      void clienteQuery.invalidateQueries({ queryKey: ['inmueble', id] });
    },
    onError: (e) => {
      setMensajeResena(e instanceof Error ? e.message : 'No pudimos guardar tu resena.');
    },
  });

  const eliminar = useMutation({
    mutationFn: () => pedir(`/api/inmuebles/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
      navegar('/mis-inmuebles', { replace: true });
    },
  });

  if (isLoading) return <Cargando texto="Cargando el inmueble..." />;

  if (isError || !data) {
    return (
      <div className="contenedor-app py-10">
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No encontramos ese inmueble.'}
          alReintentar={() => void refetch()}
        />
        <div className="mt-4 text-center">
          <Link to="/" className="boton-suave">
            Volver a la busqueda
          </Link>
        </div>
      </div>
    );
  }

  const { inmueble, esFavorito, esDueno, resenas } = data;

  return (
    <div className="contenedor-app py-6 pb-28 lg:pb-10">
      <Link to="/" className="mb-4 inline-block text-sm font-semibold text-confianza-600">
        &larr; Volver a la busqueda
      </Link>

      <Carrusel fotos={inmueble.fotos} titulo={inmueble.titulo} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div>
            <span className="chip">{ETIQUETAS_TIPO[inmueble.tipo]}</span>
            <h1 className="mt-2 text-2xl leading-tight font-extrabold text-piedra-900 sm:text-3xl">
              {inmueble.titulo}
            </h1>
            <p className="mt-1 text-piedra-600">
              {inmueble.barrio} · {distancia(inmueble.distanciaUniversidadKm)}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-terracota-600">
              {pesos(inmueble.precio)}
              <span className="text-base font-medium text-piedra-600"> / mes</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="chip">
              {inmueble.habitaciones} {inmueble.habitaciones === 1 ? 'habitacion' : 'habitaciones'}
            </span>
            <span className="chip">
              {inmueble.banos} {inmueble.banos === 1 ? 'bano' : 'banos'}
            </span>
            <span className="chip">{inmueble.amoblado ? 'Amoblado' : 'Sin amoblar'}</span>
          </div>

          <section>
            <h2 className="mb-2 text-lg font-bold text-piedra-900">Sobre este lugar</h2>
            <p className="leading-relaxed whitespace-pre-line text-piedra-800">
              {inmueble.descripcion}
            </p>
          </section>

          {inmueble.servicios.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-bold text-piedra-900">Que incluye</h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {inmueble.servicios.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-piedra-800">
                    <span className="text-terracota-500">✓</span>
                    {ETIQUETAS_SERVICIO[s] ?? s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-bold text-piedra-900">Donde queda</h2>
            <p className="mb-3 text-sm text-piedra-600">{inmueble.direccion}</p>
            <Mapa
              lat={inmueble.lat}
              lng={inmueble.lng}
              titulo={inmueble.titulo}
              direccion={inmueble.direccion}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-piedra-900">
                Que dicen del arrendador ({resenas.length})
              </h2>
              <Estrellas
                valor={inmueble.arrendador.calificacionPromedio}
                total={inmueble.arrendador.totalResenas}
                tamano="md"
              />
            </div>

            {resenas.length === 0 ? (
              <p className="rounded-xl bg-piedra-100 px-4 py-6 text-center text-sm text-piedra-600">
                Todavia nadie ha calificado a este arrendador. Si viviste aqui, tu opinion le sirve
                al siguiente estudiante.
              </p>
            ) : (
              <ul className="space-y-3">
                {resenas.map((r) => (
                  <li key={r.id} className="tarjeta p-4">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-piedra-900">{r.autor}</strong>
                      <Estrellas valor={r.calificacion} />
                    </div>
                    <p className="mt-2 text-sm text-piedra-800">{r.comentario}</p>
                    <p className="mt-2 text-xs text-piedra-400">{fechaCorta(r.creadoEn)}</p>
                  </li>
                ))}
              </ul>
            )}

            {usuario?.rol === 'ESTUDIANTE' && !esDueno && (
              <div className="tarjeta mt-4 space-y-3 p-4">
                <h3 className="font-bold text-piedra-900">Cuenta tu experiencia</h3>
                {mensajeResena && (
                  <Aviso tipo={enviarResena.isError ? 'error' : 'exito'}>{mensajeResena}</Aviso>
                )}
                <SelectorEstrellas valor={calificacion} alCambiar={setCalificacion} />
                <textarea
                  className="campo min-h-24 py-3"
                  rows={3}
                  placeholder="Como fue tratar con este arrendador? Cumplio lo que prometio?"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <button
                  type="button"
                  className="boton-confianza w-full"
                  disabled={enviarResena.isPending || comentario.trim().length < 15}
                  onClick={() => enviarResena.mutate()}
                >
                  {enviarResena.isPending ? 'Enviando...' : 'Publicar resena'}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="tarjeta space-y-3 p-5">
            <div>
              <p className="text-sm text-piedra-600">Publicado por</p>
              <p className="font-bold text-piedra-900">{inmueble.arrendador.nombre}</p>
              <Estrellas
                valor={inmueble.arrendador.calificacionPromedio}
                total={inmueble.arrendador.totalResenas}
              />
            </div>

            {esDueno ? (
              <div className="space-y-2">
                <Link to={`/inmueble/${inmueble.id}/editar`} className="boton-confianza w-full">
                  Editar publicacion
                </Link>
                <button
                  type="button"
                  className="boton-suave w-full text-terracota-700"
                  disabled={eliminar.isPending}
                  onClick={() => {
                    if (window.confirm('Seguro que quieres eliminar este inmueble?')) {
                      eliminar.mutate();
                    }
                  }}
                >
                  {eliminar.isPending ? 'Eliminando...' : 'Eliminar publicacion'}
                </button>
              </div>
            ) : contacto ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-confianza-50 p-4 text-center">
                  <p className="text-sm text-piedra-600">Celular del arrendador</p>
                  <p className="text-xl font-extrabold text-confianza-700">{contacto.telefono}</p>
                </div>
                <a
                  href={contacto.enlaceWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="boton-primario w-full"
                >
                  Escribir por WhatsApp
                </a>
                <a href={`tel:${contacto.telefono}`} className="boton-suave w-full">
                  Llamar ahora
                </a>
              </div>
            ) : (
              <>
                {errorContacto && <Aviso tipo="error">{errorContacto}</Aviso>}
                <button
                  type="button"
                  className="boton-primario w-full"
                  disabled={pedirContacto.isPending}
                  onClick={() => {
                    if (!usuario) {
                      navegar('/entrar', { state: { desde: `/inmueble/${inmueble.id}` } });
                      return;
                    }
                    pedirContacto.mutate();
                  }}
                >
                  {pedirContacto.isPending ? 'Un momento...' : 'Contactar al arrendador'}
                </button>
                <p className="text-center text-xs text-piedra-600">
                  Mostramos el numero solo cuando pulsas el boton, para proteger al arrendador del
                  spam.
                </p>
              </>
            )}

            {!esDueno && usuario && (
              <button
                type="button"
                className="boton-suave w-full"
                disabled={favorito.isPending}
                onClick={() => favorito.mutate(!esFavorito)}
              >
                {esFavorito ? '★ Guardado en favoritos' : '☆ Guardar en favoritos'}
              </button>
            )}
          </div>

          <p className="px-2 text-xs text-piedra-600">
            Publicado el {fechaCorta(inmueble.creadoEn)}. Verifica siempre el inmueble en persona
            antes de entregar dinero.
          </p>
        </aside>
      </div>
    </div>
  );
}
