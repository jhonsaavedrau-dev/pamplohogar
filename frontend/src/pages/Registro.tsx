import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSesion } from '../lib/sesion';
import { Aviso } from '../components/Estados';

const esquema = z
  .object({
    nombre: z.string().trim().min(3, 'Escribe tu nombre completo.'),
    email: z.string().trim().min(1, 'Escribe tu correo.').email('Ese correo no parece valido.'),
    telefono: z
      .string()
      .trim()
      .regex(/^3\d{9}$/, 'El celular debe tener 10 digitos y empezar por 3.')
      .or(z.literal('')),
    password: z.string().min(8, 'Usa al menos 8 caracteres.'),
    rol: z.enum(['ESTUDIANTE', 'ARRENDADOR']),
  })
  .refine((d) => d.rol !== 'ARRENDADOR' || d.telefono !== '', {
    path: ['telefono'],
    message: 'Como arrendador necesitas registrar tu celular para que te contacten.',
  });

type Datos = z.infer<typeof esquema>;

export function Registro() {
  const { registrar } = useSesion();
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
    defaultValues: { rol: 'ESTUDIANTE', telefono: '' },
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
        ...(datos.telefono !== '' ? { telefono: datos.telefono } : {}),
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

        <fieldset>
          <legend className="etiqueta">Que vas a hacer aquí?</legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { valor: 'ESTUDIANTE', titulo: 'Busco vivienda', pie: 'Soy estudiante' },
                { valor: 'ARRENDADOR', titulo: 'Ofrezco vivienda', pie: 'Soy arrendador' },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setValue('rol', opcion.valor, { shouldValidate: true })}
                aria-pressed={rol === opcion.valor}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  rol === opcion.valor
                    ? 'border-terracota-500 bg-terracota-50'
                    : 'border-piedra-200 bg-white'
                }`}
              >
                <span className="block font-bold text-piedra-900">{opcion.titulo}</span>
                <span className="block text-sm text-piedra-600">{opcion.pie}</span>
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
          <label className="etiqueta" htmlFor="telefono">
            Celular {rol === 'ARRENDADOR' ? '' : '(opcional)'}
          </label>
          <input
            id="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="3001234567"
            className="campo"
            {...register('telefono')}
          />
          <p className="mt-1 text-xs text-piedra-600">
            {rol === 'ARRENDADOR'
              ? 'Solo se lo mostramos a los estudiantes que pulsan Contactar.'
              : 'Puedes dejarlo vacio.'}
          </p>
          {errors.telefono && (
            <p className="mt-1 text-sm text-terracota-600">{errors.telefono.message}</p>
          )}
        </div>

        <div>
          <label className="etiqueta" htmlFor="password-registro">
            Contrasena
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
      </form>
    </div>
  );
}
