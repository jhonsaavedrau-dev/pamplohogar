import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fechaCorta } from '../lib/formato';
import { Aviso, Cargando, EstadoError } from '../components/Estados';

type Metodo = 'APP' | 'CORREO';

interface EstadoDobleFactor {
  activada: boolean;
  metodo: Metodo;
  correoDisponible: boolean;
  desde: string | null;
  codigosDeRespaldoSinUsar: number;
}

interface Preparacion {
  metodo: Metodo;
  direccionParaLaApp?: string;
  claveParaEscribir?: string;
  correoEnviadoA?: string;
}

export function MiCuenta() {
  const { usuario } = useSesion();
  const clientes = useQueryClient();

  const [preparacion, setPreparacion] = useState<Preparacion | null>(null);
  const [codigo, setCodigo] = useState('');
  const [respaldos, setRespaldos] = useState<string[] | null>(null);
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [huboError, setHuboError] = useState(false);

  const avisar = (texto: string, error = false) => {
    setMensaje(texto);
    setHuboError(error);
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['dobleFactor'],
    queryFn: () => pedir<EstadoDobleFactor>('/api/auth/doble-factor'),
  });

  const preparar = useMutation({
    mutationFn: (comoLlega: Metodo) =>
      pedir<Preparacion>('/api/auth/doble-factor/preparar', {
        metodo: 'POST',
        cuerpo: { metodo: comoLlega },
      }),
    onSuccess: (r) => {
      setPreparacion(r);
      avisar('');
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'No pudimos empezar.', true),
  });

  const activar = useMutation({
    mutationFn: () =>
      pedir<{ codigosDeRespaldo: string[] }>('/api/auth/doble-factor/activar', {
        metodo: 'POST',
        cuerpo: { codigo },
      }),
    onSuccess: (r) => {
      setRespaldos(r.codigosDeRespaldo);
      setPreparacion(null);
      setCodigo('');
      avisar('Listo. Tu cuenta ya pide un código para entrar.');
      void clientes.invalidateQueries({ queryKey: ['dobleFactor'] });
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'Ese código no sirvió.', true),
  });

  const apagar = useMutation({
    mutationFn: () =>
      pedir('/api/auth/doble-factor/apagar', { metodo: 'POST', cuerpo: { password } }),
    onSuccess: () => {
      setPassword('');
      setRespaldos(null);
      avisar('Verificación desactivada.');
      void clientes.invalidateQueries({ queryKey: ['dobleFactor'] });
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'No pudimos desactivarla.', true),
  });

  if (isPending) return <Cargando texto="Cargando tu cuenta..." />;

  if (isError || !data) {
    return (
      <div className="contenedor-app max-w-2xl py-8">
        <EstadoError
          mensaje={error instanceof Error ? error.message : 'No pudimos cargar tu cuenta.'}
          alReintentar={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="contenedor-app max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="titular">Mi cuenta</h1>
        <p className="mt-1 text-piedra-600">
          {usuario?.nombre} - {usuario?.email}
        </p>
      </div>

      {mensaje !== '' && <Aviso tipo={huboError ? 'error' : 'exito'}>{mensaje}</Aviso>}

      <section className="tarjeta space-y-4 p-5">
        <div>
          <h2 className="text-lg font-bold text-piedra-900">Verificación en dos pasos</h2>
          <p className="mt-1 text-sm text-piedra-700">
            Pide un código de tu celular además de la contraseña. Si alguien se entera de tu
            contraseña, igual no puede entrar.
          </p>
        </div>

        {/* Los codigos de respaldo se ven una sola vez, justo despues de activar. */}
        {respaldos !== null && (
          <div className="rounded-xl border border-terracota-200 bg-terracota-50 p-4">
            <h3 className="font-bold text-terracota-700">Guarda estos códigos ahora</h3>
            <p className="mt-1 text-sm text-piedra-800">
              Son para entrar si pierdes el celular. Cada uno sirve una sola vez y no los vas a
              volver a ver. Anótalos en un papel o guárdalos donde no se te pierdan.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-piedra-900">
              {respaldos.map((c) => (
                <li key={c} className="rounded-lg bg-white px-3 py-2 text-center">
                  {c}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="boton-suave mt-3 w-full"
              onClick={() => setRespaldos(null)}
            >
              Ya los guardé
            </button>
          </div>
        )}

        {data.activada ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-verificado-50 px-4 py-3 text-sm font-semibold text-verificado-700">
              Activada{data.desde !== null ? ` desde el ${fechaCorta(data.desde)}` : ''}, con el
              código {data.metodo === 'CORREO' ? 'por correo' : 'de tu app de autenticación'}. Te
              quedan {data.codigosDeRespaldoSinUsar} códigos de respaldo.
            </p>

            <div>
              <label className="etiqueta" htmlFor="clave-apagar">
                Para desactivarla, escribe tu contraseña
              </label>
              <input
                id="clave-apagar"
                type="password"
                className="campo"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="boton-suave w-full text-terracota-700"
              disabled={apagar.isPending || password.length === 0}
              onClick={() => apagar.mutate()}
            >
              {apagar.isPending ? 'Desactivando...' : 'Desactivar la verificación'}
            </button>
          </div>
        ) : preparacion === null ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-piedra-900">¿Por dónde quieres el código?</p>

            <button
              type="button"
              className="tarjeta w-full p-4 text-left transition-colors hover:bg-piedra-50"
              disabled={preparar.isPending}
              onClick={() => preparar.mutate('APP')}
            >
              <strong className="text-piedra-900">Con una app de autenticación</strong>
              <p className="mt-1 text-sm text-piedra-700">
                Google Authenticator, Microsoft Authenticator, Authy o la que uses. Funciona sin
                internet y el código cambia cada treinta segundos. Es la más segura.
              </p>
            </button>

            <button
              type="button"
              className="tarjeta w-full p-4 text-left transition-colors hover:bg-piedra-50 disabled:opacity-60"
              disabled={preparar.isPending}
              onClick={() => preparar.mutate('CORREO')}
            >
              <strong className="text-piedra-900">Por correo</strong>
              <p className="mt-1 text-sm text-piedra-700">
                Te llega un código de seis dígitos cada vez que entres. No hay que instalar nada.
              </p>
              {/*
                Se dice antes, no despues. Si el correo no sale, la activacion
                se cae sola y no se activa nada, pero es mejor que la persona
                sepa por que puede pasarle.
              */}
              <p className="mt-2 text-sm text-piedra-600">
                Te vamos a mandar un código de prueba. Si no te llega, no se activa nada.
              </p>
            </button>

            {preparar.isPending && <p className="text-sm text-piedra-600">Un momento...</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {preparacion.metodo === 'CORREO' ? (
              <div>
                <h3 className="font-bold text-piedra-900">1. Revisa tu correo</h3>
                <p className="mt-1 text-sm text-piedra-700">
                  Te mandamos un código a <strong>{preparacion.correoEnviadoA}</strong>. Puede
                  demorarse un minuto, y a veces cae en correo no deseado.
                </p>
              </div>
            ) : (
            <div>
              <h3 className="font-bold text-piedra-900">1. Configura tu app</h3>
              <p className="mt-1 text-sm text-piedra-700">
                Desde el celular, toca este botón y tu app queda lista sola.
              </p>
              <a href={preparacion.direccionParaLaApp ?? '#'} className="boton-confianza mt-2 w-full">
                Abrir mi app de autenticación
              </a>
              <p className="mt-3 text-sm text-piedra-700">
                Si estás en el computador, abre la app y elige agregar una cuenta escribiendo la
                clave a mano:
              </p>
              <p className="mt-1 rounded-lg bg-piedra-100 px-3 py-2 text-center font-mono text-sm break-all text-piedra-900">
                {preparacion.claveParaEscribir}
              </p>
            </div>

            )}

            <div>
              <h3 className="font-bold text-piedra-900">
                {preparacion.metodo === 'CORREO'
                  ? '2. Escribe el código que te llegó'
                  : '2. Escribe el código que te muestra'}
              </h3>
              <input
                className="campo mt-2 text-center text-2xl tracking-[0.4em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="boton-primario w-full"
              disabled={activar.isPending || codigo.trim().length < 6}
              onClick={() => activar.mutate()}
            >
              {activar.isPending ? 'Comprobando...' : 'Terminar de activar'}
            </button>

            <button
              type="button"
              className="w-full text-sm font-semibold text-piedra-600"
              onClick={() => {
                setPreparacion(null);
                setCodigo('');
                avisar('');
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
