import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSesion } from '../lib/sesion';
import { Aviso } from '../components/Estados';
import { BotonGoogle } from '../components/BotonGoogle';

// El celular ya no se pide aqui. Se pide al publicar, que es cuando de verdad
// hace falta, y asi la puerta de entrada tiene tres campos en vez de cuatro.
const esquema = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre completo.'),
  email: z.string().trim().min(1, 'Escribe tu correo.').email('Ese correo no parece válido.'),
  password: z.string().min(8, 'Usa al menos 8 caracteres.'),
  rol: z.enum(['ESTUDIANTE', 'ARRENDADOR']),
});

type Datos = z.infer<typeof esquema>;

export function Registro() {
  const { registrar, entrarConGoogle } = useSesion();
  const navegar = useNavigate();
  const [errorServidor, setErrorServidor] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { rol: 'ESTUDIANTE' },
  });

  const rol = watch('rol');

  const enviar = handleSubmit(async (datos) => {
    setErrorServidor('');
    try {
      const usuario = await registrar({
        nombre: datos.nombre,
        email: datos.email,
        password: datos.password,
        rol: datos.rol,
      });
      navegar(usuario.rol === 'ARRENDADOR' ? '/mis-inmuebles' : '/', { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : 'No pudimos crear tu cuenta.');
    }
  });

  return (
    <div className="contenedor-app max-w-md py-10">
      <h1 className="titular">Crear cuenta</h1>
      <p className="mt-2 text-sm text-piedra-600">
        Es gratis. Elige si vas a buscar vivienda o si vas a publicarla.
      </p>

      <form onSubmit={enviar} className="tarjeta mt-6 space-y-4 p-5" noValidate>
        {errorServidor && <Aviso tipo="error">{errorServidor}</Aviso>}

        {/*
          Antes eran dos tarjetas grandes que parecian una decision seria. Son
          dos pastillas: casi todo el que llega es estudiante, viene marcado
          asi, y quien arrienda lo cambia de un toque.
        */}
        <fieldset>
          <legend className="etiqueta">Vengo a</legend>
          <div className="flex gap-2">
            {(
              [
                { valor: 'ESTUDIANTE', titulo: 'Buscar vivienda' },
                { valor: 'ARRENDADOR', titulo: 'Publicar vivienda' },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setValue('rol', opcion.valor, { shouldValidate: true })}
                aria-pressed={rol === opcion.valor}
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                  rol === opcion.valor
                    ? 'border-terracota-600 bg-terracota-600 text-white'
                    : 'border-piedra-200 bg-white text-piedra-700'
                }`}
              >
                {opcion.titulo}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="etiqueta" htmlFor="nombre">
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            autoComplete="name"
            className="campo"
            {...register('nombre')}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-terracota-600">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label className="etiqueta" htmlFor="email-registro">
            Correo electrónico
          </label>
          <input
            id="email-registro"
            type="email"
            autoComplete="email"
            className="campo"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-terracota-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="password-registro">
            Contraseña
          </label>
          <input
            id="password-registro"
            type="password"
            autoComplete="new-password"
            className="campo"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-terracota-600">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" className="boton-primario w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-piedra-600">
          Ya tienes cuenta?{' '}
          <Link to="/entrar" className="font-semibold text-confianza-600 underline">
            Entrar
          </Link>
        </p>

        <BotonGoogle
          alRecibirCredencial={(credencial) => {
            setErrorServidor('');
            void entrarConGoogle(credencial)
              .then(() => navegar('/', { replace: true }))
              .catch((e) =>
                setErrorServidor(e instanceof Error ? e.message : 'No pudimos entrar con Google.'),
              );
          }}
        />
      </form>
    </div>
  );
}
