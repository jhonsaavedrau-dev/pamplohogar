import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSesion } from '../lib/sesion';
import { pedir } from '../lib/api';
import { Aviso } from '../components/Estados';

const esquema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo.').email('Ese correo no parece valido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

type Datos = z.infer<typeof esquema>;

export function Entrar() {
  const { entrar, terminarConCodigo } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [errorServidor, setErrorServidor] = useState('');
  // Cuando la cuenta tiene verificacion en dos pasos, aqui queda el pase que
  // permite terminar de entrar escribiendo el codigo.
  const [paseIntermedio, setPaseIntermedio] = useState('');
  const [porCorreo, setPorCorreo] = useState(false);
  const [correoSalio, setCorreoSalio] = useState(true);
  const [reenviando, setReenviando] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema) });

  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/';

  const enviar = handleSubmit(async (datos) => {
    setErrorServidor('');
    try {
      const resultado = await entrar(datos.email, datos.password);
      if (!resultado.listo) {
        setPaseIntermedio(resultado.paseIntermedio);
        setPorCorreo(resultado.metodo === 'CORREO');
        setCorreoSalio(resultado.correoEnviado !== false);
        return;
      }
      navegar(destino, { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : 'No pudimos iniciar tu sesión.');
    }
  });

  const enviarCodigo = async () => {
    setErrorServidor('');
    setEnviandoCodigo(true);
    try {
      await terminarConCodigo(paseIntermedio, codigo);
      navegar(destino, { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : 'No pudimos comprobar el código.');
    } finally {
      setEnviandoCodigo(false);
    }
  };

  if (paseIntermedio !== '') {
    return (
      <div className="contenedor-app max-w-md py-10">
        <h1 className="titular">Escribe tu código</h1>
        <p className="mt-2 text-sm text-piedra-600">
          {porCorreo
            ? 'Tu cuenta tiene verificación en dos pasos. Te mandamos un código de seis dígitos a tu correo.'
            : 'Tu cuenta tiene verificación en dos pasos. Abre tu app de autenticación y escribe el código de seis dígitos que te muestre.'}
        </p>

        <form
          className="tarjeta mt-6 space-y-4 p-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim().length >= 6 && !enviandoCodigo) void enviarCodigo();
          }}
        >
          {errorServidor && <Aviso tipo="error">{errorServidor}</Aviso>}

          {porCorreo && !correoSalio && (
            <Aviso tipo="error">
              No pudimos enviarte el correo con el código. Usa uno de tus códigos de respaldo.
            </Aviso>
          )}

          <div>
            <label className="etiqueta" htmlFor="codigo">
              Código
            </label>
            <input
              id="codigo"
              className="campo text-center text-2xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              maxLength={20}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="boton-primario w-full"
            disabled={enviandoCodigo || codigo.trim().length < 6}
          >
            {enviandoCodigo ? 'Comprobando...' : 'Entrar'}
          </button>

          {porCorreo && (
            <button
              type="button"
              className="tocable text-sm font-semibold text-confianza-600"
              disabled={reenviando}
              onClick={() => {
                setReenviando(true);
                setErrorServidor('');
                void pedir<{ enviado: boolean }>('/api/auth/login/codigo/reenviar', {
                  metodo: 'POST',
                  cuerpo: { paseIntermedio },
                })
                  .then((r) => setCorreoSalio(r.enviado))
                  .catch((e) =>
                    setErrorServidor(e instanceof Error ? e.message : 'No pudimos reenviarlo.'),
                  )
                  .finally(() => setReenviando(false));
              }}
            >
              {reenviando ? 'Enviando...' : 'No me llegó, mándamelo otra vez'}
            </button>
          )}

          <p className="text-sm text-piedra-600">
            Si perdiste {porCorreo ? 'el acceso al correo' : 'el celular'}, escribe aquí uno de los
            códigos de respaldo que guardaste.
          </p>

          <button
            type="button"
            className="text-sm font-semibold text-confianza-600"
            onClick={() => {
              setPaseIntermedio('');
              setCodigo('');
              setErrorServidor('');
            }}
          >
            Volver
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="contenedor-app max-w-md py-10">
      <h1 className="titular">Entrar a PamploHogar</h1>
      <p className="mt-2 text-sm text-piedra-600">
        Inicia sesión para guardar favoritos, contactar arrendadores y publicar inmuebles.
      </p>

      <form onSubmit={enviar} className="tarjeta mt-6 space-y-4 p-5" noValidate>
        {errorServidor && <Aviso tipo="error">{errorServidor}</Aviso>}

        <div>
          <label className="etiqueta" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="campo"
            placeholder="tucorreo@unipamplona.edu.co"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-terracota-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="campo"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-terracota-600">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" className="boton-primario w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm">
          <Link to="/recuperar" className="font-semibold text-confianza-600 underline">
            Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-center text-sm text-piedra-600">
          No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-confianza-600 underline">
            Crear una
          </Link>
        </p>
      </form>
    </div>
  );
}
