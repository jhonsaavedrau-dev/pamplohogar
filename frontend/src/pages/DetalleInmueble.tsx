import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { useComparador } from '../lib/comparador';
import type { RespuestaContacto, RespuestaDetalle } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO } from '../lib/tipos';
import { distancia, fechaCorta, pesos } from '../lib/formato';
import { fotoDeAncho } from '../lib/fotos';
import { Carrusel } from '../components/Carrusel';
import { MapaDiferido } from '../components/MapaDiferido';
import { Estrellas, SelectorEstrellas } from '../components/Estrellas';
import { Aviso, Cargando, EstadoError } from '../components/Estados';
import { HistorialDePrecios } from '../components/HistorialDePrecios';
import { ComparadoConElBarrio } from '../components/ComparadoConElBarrio';
import { ComoEsElBarrio } from '../components/ComoEsElBarrio';
import { BotonReportar } from '../components/BotonReportar';

export function DetalleInmueble() {
  const { id = '' } = useParams();
  const { usuario } = useSesion();
  const { ids: idsComparador } = useComparador();
  const hayComparador = idsComparador.length > 0;
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
      setMensajeResena('Gracias, tu reseña quedó publicada.');
      setComentario('');
      void clienteQuery.invalidateQueries({ queryKey: ['inmueble', id] });
    },
    onError: (e) => {
      setMensajeResena(e instanceof Error ? e.message : 'No pudimos guardar tu reseña.');
    },
  });

  const abrirChat = useMutation({
    mutationFn: () =>
      pedir<{ conversacionId: string }>('/api/conversaciones', {
        metodo: 'POST',
        cuerpo: { inmuebleId: id },
      }),
    onSuccess: (r) => navegar(`/mensajes/${r.conversacionId}`),
    onError: (e) =>
      setErrorContacto(e instanceof Error ? e.message : 'No pudimos abrir la conversación.'),
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

  const { inmueble, esFavorito, esDueno, resenas, cambiosDePrecio, referenciaDePrecio } = data;

  return (
    <div className="contenedor-app py-6 pb-28 lg:pb-10">
      <Link to="/" className="tocable mb-2 text-sm font-semibold text-confianza-600">
        &larr; Volver a la busqueda
      </Link>

      <Carrusel fotos={inmueble.fotos} titulo={inmueble.titulo} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div>
            <span className="chip">{ETIQUETAS_TIPO[inmueble.tipo]}</span>
            <h1 className="titular mt-3">{inmueble.titulo}</h1>
            <p className="mt-2 text-piedra-600">
              {inmueble.barrio}
              <span className="mx-1.5 text-piedra-300" aria-hidden="true">
                ·
              </span>
              {distancia(inmueble.distanciaUniversidadKm)}
            </p>
            <p className="mt-4 text-[2.25rem] leading-none font-extrabold tracking-tight text-terracota-600">
              {pesos(inmueble.precio)}
              <span className="ml-1 text-base font-medium text-piedra-500">al mes</span>
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-3 rounded-2xl border border-piedra-200 bg-white p-4">
            {[
              {
                etiqueta: inmueble.habitaciones === 1 ? 'Habitación' : 'Habitaciones',
                valor: String(inmueble.habitaciones),
              },
              {
                etiqueta: inmueble.banos === 1 ? 'Baño' : 'Baños',
                valor: String(inmueble.banos),
              },
              { etiqueta: 'Muebles', valor: inmueble.amoblado ? 'Incluidos' : 'No incluye' },
            ].map((dato) => (
              <div key={dato.etiqueta} className="text-center">
                <dt className="text-xs text-piedra-500">{dato.etiqueta}</dt>
                <dd className="mt-1 font-semibold text-piedra-900">{dato.valor}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-piedra-900">Sobre este lugar</h2>
            <p className="leading-relaxed whitespace-pre-line text-piedra-700">
              {inmueble.descripcion}
            </p>
          </section>

          {inmueble.servicios.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold text-piedra-900">Que incluye</h2>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {inmueble.servicios.map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-piedra-800 ring-1 ring-piedra-200 ring-inset"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 shrink-0 text-terracota-500"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8.2 13.6 4.9 10.3l1.3-1.3 2 2 5.6-5.6 1.3 1.4z" />
                    </svg>
                    {ETIQUETAS_SERVICIO[s] ?? s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ComparadoConElBarrio referencia={referenciaDePrecio} barrio={inmueble.barrio} />

          <HistorialDePrecios cambios={cambiosDePrecio} precioActual={inmueble.precio} />

          <section>
            <h2 className="mb-3 text-xl font-semibold text-piedra-900">Donde queda</h2>
            <p className="mb-3 text-sm text-piedra-600">{inmueble.direccion}</p>
            <MapaDiferido
              lat={inmueble.lat}
              lng={inmueble.lng}
              titulo={inmueble.titulo}
              direccion={inmueble.direccion}
            />
          </section>

          <ComoEsElBarrio barrio={inmueble.barrio} />

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
                Todavia nadie ha calificado a este arrendador. Si viviste aquí, tu opinion le sirve
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
                  {enviarResena.isPending ? 'Enviando...' : 'Publicar reseña'}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="tarjeta space-y-4 p-5 shadow-[var(--shadow-elevada)]">
            <div className="border-b border-piedra-100 pb-4">
              <p className="text-2xl leading-none font-extrabold tracking-tight text-piedra-900">
                {pesos(inmueble.precio)}
                <span className="ml-1 text-sm font-medium text-piedra-500">al mes</span>
              </p>
              <p className="mt-3 text-sm text-piedra-500">Publicado por</p>

              {/*
                Con cara y con unas lineas, escribirle a un desconocido cuesta
                menos. Si no puso nada, se ven las iniciales y ya.
              */}
              <div className="mt-1 flex items-start gap-3">
                {inmueble.arrendador.foto ? (
                  <img
                    src={fotoDeAncho(inmueble.arrendador.foto, 120)}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-terracota-100 text-sm font-bold text-terracota-700">
                    {inmueble.arrendador.nombre
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? '')
                      .join('')}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-piedra-900">{inmueble.arrendador.nombre}</p>
                  {inmueble.arrendador.correoConfirmado && (
                    <span className="inline-block rounded-full bg-verificado-50 px-2 py-0.5 text-xs font-semibold text-verificado-700">
                      Correo confirmado
                    </span>
                  )}
                  <Estrellas
                    valor={inmueble.arrendador.calificacionPromedio}
                    total={inmueble.arrendador.totalResenas}
                  />
                </div>
              </div>

              {inmueble.arrendador.descripcion && (
                <p className="mt-2 text-sm text-piedra-700">{inmueble.arrendador.descripcion}</p>
              )}
            </div>

            {esDueno ? (
              <div className="space-y-2">
                <Link to={`/inmueble/${inmueble.id}/editar`} className="boton-confianza w-full">
                  Editar publicación
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
                  {eliminar.isPending ? 'Eliminando...' : 'Eliminar publicación'}
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
                  Mostramos el número solo cuando pulsas el boton, para proteger al arrendador del
                  spam.
                </p>
              </>
            )}

            {!esDueno && (
              <>
                <button
                  type="button"
                  className="boton-confianza w-full"
                  disabled={abrirChat.isPending}
                  onClick={() => {
                    if (!usuario) {
                      navegar('/entrar', { state: { desde: `/inmueble/${inmueble.id}` } });
                      return;
                    }
                    abrirChat.mutate();
                  }}
                >
                  {abrirChat.isPending ? 'Abriendo...' : 'Escribir por la página'}
                </button>
                <p className="text-center text-xs text-piedra-600">
                  Sin dar tu número, y queda escrito lo que acordaron.
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

            <Link to={`/inmueble/${inmueble.id}/ficha`} className="boton-suave w-full">
              Guardar ficha en PDF
            </Link>
          </div>

          <p className="px-2 text-xs text-piedra-600">
            Publicado el {fechaCorta(inmueble.creadoEn)}. Verifica siempre el inmueble en persona
            antes de entregar dinero.
          </p>

          {!esDueno && (
            <div className="px-2">
              <BotonReportar inmuebleId={inmueble.id} />
            </div>
          )}
        </aside>
      </div>

      {!esDueno && (
        <div
          className={`fixed inset-x-0 z-20 border-t border-piedra-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(36,31,26,0.10)] backdrop-blur lg:hidden ${
            // Si la barra del comparador esta abajo, esta se sube para no
            // quedar tapada. Dos barras flotantes en el mismo sitio se comen
            // la una a la otra y el boton de contactar deja de existir.
            hayComparador ? 'bottom-[5.25rem]' : 'bottom-0'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-terracota-600">
                {pesos(inmueble.precio)}
                <span className="text-xs font-medium text-piedra-600"> / mes</span>
              </p>
              <p className="truncate text-xs text-piedra-600">{inmueble.barrio}</p>
            </div>

            {contacto ? (
              <a
                href={contacto.enlaceWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="boton-primario shrink-0"
              >
                Escribir por WhatsApp
              </a>
            ) : (
              <button
                type="button"
                className="boton-primario shrink-0"
                disabled={pedirContacto.isPending}
                onClick={() => {
                  if (!usuario) {
                    navegar('/entrar', { state: { desde: `/inmueble/${inmueble.id}` } });
                    return;
                  }
                  pedirContacto.mutate();
                }}
              >
                {pedirContacto.isPending ? 'Un momento...' : 'Contactar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
