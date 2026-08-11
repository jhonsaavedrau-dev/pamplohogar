import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leerToken, pedir } from '../lib/api';
import type { RespuestaDetalle, TipoInmueble } from '../lib/tipos';
import { ETIQUETAS_SERVICIO, ETIQUETAS_TIPO, SERVICIOS_DISPONIBLES } from '../lib/tipos';
import { CENTRO_PAMPLONA } from '../components/coordenadas';
import { MapaSelectorDiferido } from '../components/MapaDiferido';
import { Aviso, Cargando } from '../components/Estados';

const TIPOS: TipoInmueble[] = ['HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA'];

interface FotoFormulario {
  url: string;
  publicId: string;
}

interface EstadoFormulario {
  titulo: string;
  descripcion: string;
  tipo: TipoInmueble;
  precio: string;
  barrio: string;
  direccion: string;
  habitaciones: string;
  banos: string;
  amoblado: boolean;
  servicios: string[];
  lat: number;
  lng: number;
  fotos: FotoFormulario[];
}

const ESTADO_INICIAL: EstadoFormulario = {
  titulo: '',
  descripcion: '',
  tipo: 'HABITACION',
  precio: '',
  barrio: '',
  direccion: '',
  habitaciones: '1',
  banos: '1',
  amoblado: false,
  servicios: [],
  lat: CENTRO_PAMPLONA.lat,
  lng: CENTRO_PAMPLONA.lng,
  fotos: [],
};

const BASE_API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function FormularioInmueble() {
  const { id } = useParams();
  const editando = id !== undefined;
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [form, setForm] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [mensajeError, setMensajeError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const { data: existente, isLoading } = useQuery({
    queryKey: ['inmueble', id],
    queryFn: () => pedir<RespuestaDetalle>(`/api/inmuebles/${id}`),
    enabled: editando,
  });

  useEffect(() => {
    if (!existente) return;
    const i = existente.inmueble;
    setForm({
      titulo: i.titulo,
      descripcion: i.descripcion,
      tipo: i.tipo,
      precio: String(i.precio),
      barrio: i.barrio,
      direccion: i.direccion,
      habitaciones: String(i.habitaciones),
      banos: String(i.banos),
      amoblado: i.amoblado,
      servicios: i.servicios,
      lat: i.lat,
      lng: i.lng,
      fotos: i.fotos.map((f) => ({ url: f.url, publicId: f.publicId })),
    });
  }, [existente]);

  const cambiar = <C extends keyof EstadoFormulario>(campo: C, valor: EstadoFormulario[C]) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  };

  const alternarServicio = (servicio: string) => {
    setForm((previo) => ({
      ...previo,
      servicios: previo.servicios.includes(servicio)
        ? previo.servicios.filter((s) => s !== servicio)
        : [...previo.servicios, servicio],
    }));
  };

  const subirFotos = async (archivos: FileList) => {
    setMensajeError('');
    setSubiendo(true);
    try {
      const datos = new FormData();
      Array.from(archivos)
        .slice(0, 10 - form.fotos.length)
        .forEach((archivo) => datos.append('fotos', archivo));

      const token = leerToken();
      const respuesta = await fetch(`${BASE_API}/api/subidas/fotos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: datos,
      });

      const cuerpo: unknown = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        const mensaje =
          cuerpo !== null && typeof cuerpo === 'object' && 'mensaje' in cuerpo
            ? String((cuerpo as { mensaje: unknown }).mensaje)
            : 'No pudimos subir las fotos.';
        throw new Error(mensaje);
      }

      const nuevas = (cuerpo as { fotos: FotoFormulario[] }).fotos;
      setForm((previo) => ({ ...previo, fotos: [...previo.fotos, ...nuevas].slice(0, 10) }));
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : 'No pudimos subir las fotos.');
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = (indice: number) => {
    setForm((previo) => ({ ...previo, fotos: previo.fotos.filter((_, i) => i !== indice) }));
  };

  const validar = (): string | null => {
    if (form.titulo.trim().length < 10) return 'El titulo debe tener al menos 10 caracteres.';
    if (form.descripcion.trim().length < 30)
      return 'Cuenta un poco mas del inmueble, minimo 30 caracteres.';
    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio < 50000)
      return 'Escribe un precio valido, minimo 50.000 pesos.';
    if (form.barrio.trim().length < 3) return 'Escribe el barrio.';
    if (form.direccion.trim().length < 5) return 'Escribe la direccion.';
    return null;
  };

  const guardar = async () => {
    const problema = validar();
    if (problema) {
      setMensajeError(problema);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setMensajeError('');
    setGuardando(true);
    try {
      const cuerpo = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tipo: form.tipo,
        precio: Math.round(Number(form.precio)),
        barrio: form.barrio.trim(),
        direccion: form.direccion.trim(),
        lat: form.lat,
        lng: form.lng,
        habitaciones: Math.max(1, Number(form.habitaciones) || 1),
        banos: Math.max(1, Number(form.banos) || 1),
        servicios: form.servicios,
        amoblado: form.amoblado,
        fotos: form.fotos.map((f) => ({ url: f.url, publicId: f.publicId })),
      };

      const respuesta = editando
        ? await pedir<{ inmueble: { id: string } }>(`/api/inmuebles/${id}`, {
            metodo: 'PATCH',
            cuerpo,
          })
        : await pedir<{ inmueble: { id: string } }>('/api/inmuebles', {
            metodo: 'POST',
            cuerpo,
          });

      void clienteQuery.invalidateQueries({ queryKey: ['inmuebles'] });
      void clienteQuery.invalidateQueries({ queryKey: ['mis-inmuebles'] });
      navegar(`/inmueble/${respuesta.inmueble.id}`);
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : 'No pudimos guardar el inmueble.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setGuardando(false);
    }
  };

  if (editando && isLoading) return <Cargando texto="Cargando el inmueble..." />;

  return (
    <div className="contenedor-app max-w-2xl py-8">
      <h1 className="text-2xl font-extrabold text-piedra-900">
        {editando ? 'Editar inmueble' : 'Publicar inmueble'}
      </h1>
      <p className="mt-1 mb-6 text-sm text-piedra-600">
        Entre mas claro y honesto seas, mas rapido te escriben los estudiantes.
      </p>

      <form
        className="tarjeta space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
        noValidate
      >
        {mensajeError && <Aviso tipo="error">{mensajeError}</Aviso>}

        <div>
          <label className="etiqueta" htmlFor="titulo">
            Titulo de la publicacion
          </label>
          <input
            id="titulo"
            className="campo"
            maxLength={120}
            placeholder="Habitacion amoblada a 5 minutos de la Unipamplona"
            value={form.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="descripcion">
            Descripcion
          </label>
          <textarea
            id="descripcion"
            className="campo min-h-32 py-3"
            rows={5}
            maxLength={2000}
            placeholder="Cuenta como es el lugar, las reglas de la casa, si hay wifi, con quien se comparte, a que hora se puede entrar..."
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
          <p className="mt-1 text-xs text-piedra-600">{form.descripcion.length} / 2000</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="tipo">
              Tipo
            </label>
            <select
              id="tipo"
              className="campo"
              value={form.tipo}
              onChange={(e) => cambiar('tipo', e.target.value as TipoInmueble)}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETAS_TIPO[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="etiqueta" htmlFor="precio">
              Precio por mes (pesos)
            </label>
            <input
              id="precio"
              type="number"
              inputMode="numeric"
              min={50000}
              step={10000}
              className="campo"
              placeholder="450000"
              value={form.precio}
              onChange={(e) => cambiar('precio', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="habitaciones">
              Habitaciones
            </label>
            <input
              id="habitaciones"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              className="campo"
              value={form.habitaciones}
              onChange={(e) => cambiar('habitaciones', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="banos">
              Banos
            </label>
            <input
              id="banos"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              className="campo"
              value={form.banos}
              onChange={(e) => cambiar('banos', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="barrio">
              Barrio
            </label>
            <input
              id="barrio"
              className="campo"
              maxLength={60}
              placeholder="Centro"
              value={form.barrio}
              onChange={(e) => cambiar('barrio', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="direccion">
              Direccion
            </label>
            <input
              id="direccion"
              className="campo"
              maxLength={160}
              placeholder="Calle 5 # 6-32"
              value={form.direccion}
              onChange={(e) => cambiar('direccion', e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-base font-medium text-piedra-800">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-piedra-200 text-terracota-500 focus:ring-terracota-500"
            checked={form.amoblado}
            onChange={(e) => cambiar('amoblado', e.target.checked)}
          />
          El inmueble esta amoblado
        </label>

        <div>
          <p className="etiqueta">Que incluye el arriendo?</p>
          <div className="flex flex-wrap gap-2">
            {SERVICIOS_DISPONIBLES.map((servicio) => {
              const activo = form.servicios.includes(servicio);
              return (
                <button
                  key={servicio}
                  type="button"
                  onClick={() => alternarServicio(servicio)}
                  aria-pressed={activo}
                  className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                    activo
                      ? 'border-terracota-500 bg-terracota-500 text-white'
                      : 'border-piedra-200 bg-white text-piedra-800'
                  }`}
                >
                  {ETIQUETAS_SERVICIO[servicio]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="etiqueta">Ubicacion en el mapa</p>
          <p className="mb-2 text-xs text-piedra-600">
            Toca el mapa o arrastra la casita hasta donde queda el inmueble.
          </p>
          <MapaSelectorDiferido
            lat={form.lat}
            lng={form.lng}
            alElegir={(lat, lng) => setForm((previo) => ({ ...previo, lat, lng }))}
          />
        </div>

        <div>
          <p className="etiqueta">Fotos (maximo 10)</p>
          <label className="boton-suave w-full cursor-pointer">
            {subiendo ? 'Subiendo fotos...' : 'Elegir fotos del telefono'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={subiendo || form.fotos.length >= 10}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void subirFotos(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </label>

          {form.fotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {form.fotos.map((foto, indice) => (
                <div key={foto.publicId} className="relative">
                  <img
                    src={foto.url}
                    alt={`Foto ${indice + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFoto(indice)}
                    aria-label={`Quitar foto ${indice + 1}`}
                    className="absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-piedra-900/80 text-sm font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="boton-primario w-full" disabled={guardando || subiendo}>
          {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Publicar inmueble'}
        </button>
      </form>
    </div>
  );
}
