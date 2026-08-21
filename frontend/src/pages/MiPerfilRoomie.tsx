import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { ConQuienConvivir, PerfilRoomie, RitmoDeVida } from '../lib/tiposRoomie';
import { AYUDA_RITMO, ETIQUETAS_CON_QUIEN, ETIQUETAS_RITMO } from '../lib/tiposRoomie';
import { Aviso, Cargando } from '../components/Estados';
import { BARRIOS_DE_PAMPLONA } from '../lib/barrios';

const RITMOS: RitmoDeVida[] = ['MADRUGADOR', 'NOCTURNO', 'MIXTO'];
const CON_QUIEN: ConQuienConvivir[] = ['CUALQUIERA', 'SOLO_MUJERES', 'SOLO_HOMBRES'];

interface Formulario {
  presupuestoMax: string;
  descripcion: string;
  zonaPreferida: string;
  carrera: string;
  semestre: string;
  ritmo: RitmoDeVida;
  conQuien: ConQuienConvivir;
  fuma: boolean;
  tieneMascota: boolean;
  aceptaMascotas: boolean;
  activo: boolean;
}

const INICIAL: Formulario = {
  presupuestoMax: '',
  descripcion: '',
  zonaPreferida: '',
  carrera: '',
  semestre: '',
  ritmo: 'MIXTO',
  conQuien: 'CUALQUIERA',
  fuma: false,
  tieneMascota: false,
  aceptaMascotas: true,
  activo: true,
};

export function MiPerfilRoomie() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [form, setForm] = useState<Formulario>(INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['roomie-mio'],
    queryFn: () => pedir<{ perfil: PerfilRoomie | null }>('/api/roomies/mio'),
  });

  useEffect(() => {
    const p = data?.perfil;
    if (!p) return;
    setForm({
      presupuestoMax: String(p.presupuestoMax),
      descripcion: p.descripcion,
      zonaPreferida: p.zonaPreferida ?? '',
      carrera: p.carrera ?? '',
      semestre: p.semestre !== null ? String(p.semestre) : '',
      ritmo: p.ritmo,
      conQuien: p.conQuien,
      fuma: p.fuma,
      tieneMascota: p.tieneMascota,
      aceptaMascotas: p.aceptaMascotas,
      activo: p.activo,
    });
  }, [data]);

  const cambiar = <C extends keyof Formulario>(campo: C, valor: Formulario[C]) =>
    setForm((previo) => ({ ...previo, [campo]: valor }));

  /**
   * Que le falta al formulario, dicho como se lo dirias a alguien.
   *
   * Antes el boton simplemente se apagaba cuando la descripcion era corta. La
   * persona llenaba todo, bajaba, apretaba y no pasaba nada, sin ninguna pista
   * de por que. Un boton apagado que no se explica es peor que un error.
   */
  const queFalta = (): string[] => {
    const faltantes: string[] = [];
    const presupuesto = Math.round(Number(form.presupuestoMax) || 0);
    if (presupuesto < 50000) faltantes.push('decir cuánto puedes poner al mes');
    const largo = form.descripcion.trim().length;
    if (largo < 40) {
      faltantes.push(
        largo === 0
          ? 'contar algo de ti'
          : `contar un poco más de ti, te faltan ${40 - largo} caracteres`,
      );
    }
    return faltantes;
  };

  const guardar = useMutation({
    mutationFn: () =>
      pedir('/api/roomies/mio', {
        metodo: 'PUT',
        cuerpo: {
          presupuestoMax: Math.round(Number(form.presupuestoMax) || 0),
          descripcion: form.descripcion.trim(),
          zonaPreferida: form.zonaPreferida.trim() || undefined,
          carrera: form.carrera.trim() || undefined,
          semestre: form.semestre !== '' ? Number(form.semestre) : undefined,
          ritmo: form.ritmo,
          conQuien: form.conQuien,
          fuma: form.fuma,
          tieneMascota: form.tieneMascota,
          aceptaMascotas: form.aceptaMascotas,
          activo: form.activo,
        },
      }),
    onSuccess: () => {
      setError('');
      setMensaje('Tu perfil quedó publicado. Ya te pueden encontrar.');
      void clienteQuery.invalidateQueries({ queryKey: ['roomies'] });
      void clienteQuery.invalidateQueries({ queryKey: ['roomie-mio'] });
      window.setTimeout(() => navegar('/roomies'), 1800);
    },
    onError: (e) => {
      setMensaje('');
      setError(e instanceof Error ? e.message : 'No pudimos guardar tu perfil.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const eliminar = useMutation({
    mutationFn: () => pedir('/api/roomies/mio', { metodo: 'DELETE' }),
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['roomies'] });
      navegar('/roomies');
    },
  });

  if (isLoading) return <Cargando texto="Cargando tu perfil..." />;

  const sinCelular = usuario !== null && (usuario.telefono ?? '') === '';

  return (
    <div className="contenedor-app max-w-2xl py-8">
      <h1 className="titular">{data?.perfil ? 'Editar mi perfil' : 'Crear mi perfil de roomie'}</h1>
      <p className="mt-1 mb-6 text-sm text-piedra-600">
        Cuenta cómo eres para convivir. Entre más honesto seas, menos sorpresas después.
      </p>

      {sinCelular && (
        <div className="mb-4">
          <Aviso tipo="error">
            No tienes celular registrado, así que nadie va a poder escribirte. Agrégalo desde tu
            cuenta antes de publicar.
          </Aviso>
        </div>
      )}

      <form
        className="tarjeta space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const faltan = queFalta();
          if (faltan.length > 0) {
            setMensaje('');
            setError(`Falta ${faltan.join(' y ')}.`);
            // Los avisos van al principio del formulario y el boton al final:
            // sin esto la persona aprieta, no ve nada y cree que se dano.
            document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
          setError('');
          guardar.mutate();
        }}
        noValidate
      >
        {error && <Aviso tipo="error">{error}</Aviso>}
        {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}

        <div>
          <label className="etiqueta" htmlFor="presupuesto">
            Cuánto puedes poner al mes
          </label>
          <input
            id="presupuesto"
            type="number"
            inputMode="numeric"
            min={50000}
            step={10000}
            className="campo"
            placeholder="350000"
            value={form.presupuestoMax}
            onChange={(e) => cambiar('presupuestoMax', e.target.value)}
          />
          <p className="mt-1 text-xs text-piedra-600">
            Tu parte del arriendo, no el total del apartamento.
          </p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="descripcion-roomie">
            Cuéntanos de ti
          </label>
          <textarea
            id="descripcion-roomie"
            className="campo min-h-32 py-3"
            rows={5}
            maxLength={1000}
            placeholder="Qué estudias, cómo eres para convivir, si cocinas, si recibes visitas, qué esperas de un roomie..."
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
          <p
            className={`mt-1 text-sm ${
              form.descripcion.trim().length < 40
                ? 'font-semibold text-terracota-700'
                : 'text-piedra-600'
            }`}
          >
            {form.descripcion.trim().length < 40
              ? `Te faltan ${40 - form.descripcion.trim().length} caracteres`
              : `${form.descripcion.trim().length} caracteres, ya está bien`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="zona-roomie">
              Zona que te sirve (opcional)
            </label>
            <input
              id="zona-roomie"
              className="campo"
              maxLength={60}
              placeholder="El Buque, Centro..."
              list="barrios-de-pamplona"
              value={form.zonaPreferida}
              onChange={(e) => cambiar('zonaPreferida', e.target.value)}
            />
            {/* Los barrios de verdad, sugeridos mientras se escribe. */}
            <datalist id="barrios-de-pamplona">
              {BARRIOS_DE_PAMPLONA.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="etiqueta" htmlFor="carrera">
              Qué estudias (opcional)
            </label>
            <input
              id="carrera"
              className="campo"
              maxLength={60}
              placeholder="Ingeniería de sistemas"
              value={form.carrera}
              onChange={(e) => cambiar('carrera', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="semestre">
              Semestre (opcional)
            </label>
            <input
              id="semestre"
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              className="campo"
              value={form.semestre}
              onChange={(e) => cambiar('semestre', e.target.value)}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="con-quien">
              Con quién quieres vivir
            </label>
            <select
              id="con-quien"
              className="campo"
              value={form.conQuien}
              onChange={(e) => cambiar('conQuien', e.target.value as ConQuienConvivir)}
            >
              {CON_QUIEN.map((c) => (
                <option key={c} value={c}>
                  {ETIQUETAS_CON_QUIEN[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="etiqueta">Tu ritmo de vida</legend>
          <div className="space-y-2">
            {RITMOS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => cambiar('ritmo', r)}
                aria-pressed={form.ritmo === r}
                className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                  form.ritmo === r
                    ? 'border-terracota-500 bg-terracota-50'
                    : 'border-piedra-200 bg-white'
                }`}
              >
                <span className="block text-sm font-bold text-piedra-900">
                  {ETIQUETAS_RITMO[r]}
                </span>
                <span className="block text-xs text-piedra-600">{AYUDA_RITMO[r]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2.5">
          {(
            [
              { campo: 'fuma', texto: 'Fumo' },
              { campo: 'tieneMascota', texto: 'Tengo mascota' },
              { campo: 'aceptaMascotas', texto: 'Acepto vivir con mascotas' },
            ] as const
          ).map((o) => (
            <label
              key={o.campo}
              className="flex items-center gap-3 text-base font-medium text-piedra-800"
            >
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
                checked={form[o.campo]}
                onChange={(e) => cambiar(o.campo, e.target.checked)}
              />
              {o.texto}
            </label>
          ))}
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-xl bg-piedra-100 p-3 text-base font-medium text-piedra-800">
          <input
            type="checkbox"
            className="h-6 w-6 shrink-0 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
            checked={form.activo}
            onChange={(e) => cambiar('activo', e.target.checked)}
          />
          Mostrar mi perfil a los demás
        </label>

        <button
          type="submit"
          className="boton-primario w-full"
          disabled={guardar.isPending}
        >
          {guardar.isPending ? 'Guardando...' : data?.perfil ? 'Guardar cambios' : 'Publicar perfil'}
        </button>

        {data?.perfil && (
          <button
            type="button"
            className="boton-suave w-full text-terracota-700"
            disabled={eliminar.isPending}
            onClick={() => {
              if (window.confirm('Eliminar tu perfil de roomie? Se puede volver a crear después.')) {
                eliminar.mutate();
              }
            }}
          >
            Eliminar mi perfil
          </button>
        )}

        <p className="text-center text-sm">
          <Link to="/roomies" className="font-semibold text-confianza-600 underline">
            Volver a ver quién busca roomie
          </Link>
        </p>
      </form>
    </div>
  );
}
