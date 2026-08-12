import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSesion } from '../lib/sesion';
import { Aviso } from '../components/Estados';

const esquema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo.').email('Ese correo no parece valido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

type Datos = z.infer<typeof esquema>;

export function Entrar() {
  const { entrar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [errorServidor, setErrorServidor] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema) });

  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/';

  const enviar = handleSubmit(async (datos) => {
    setErrorServidor('');
    try {
      await entrar(datos.email, datos.password);
      navegar(destino, { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : 'No pudimos iniciar tu sesión.');
    }
  });

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
            Contrasena
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
