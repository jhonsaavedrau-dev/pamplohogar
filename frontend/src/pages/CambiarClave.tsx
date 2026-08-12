import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pedir } from '../lib/api';
import { Aviso, EstadoVacio } from '../components/Estados';

const esquema = z
  .object({
    password: z.string().min(8, 'Usa al menos 8 caracteres.'),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, {
    path: ['confirmacion'],
    message: 'Las dos contrasenas no son iguales.',
  });

type Datos = z.infer<typeof esquema>;

export function CambiarClave() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token') ?? '';

  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema) });

  const enviar = handleSubmit(async (datos) => {
    setError('');
    try {
      await pedir('/api/auth/restablecer', {
        metodo: 'POST',
        cuerpo: { token, password: datos.password },
      });
      setListo(true);
      window.setTimeout(() => navegar('/entrar', { replace: true }), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar tu contrasena.');
    }
  });

  if (token === '') {
    return (
      <div className="contenedor-app max-w-md py-10">
        <EstadoVacio
          titulo="Este enlace esta incompleto"
          descripcion="Abre el enlace tal cual te llego al correo, sin cortarlo. Si no funciona, pide uno nuevo."
          accion={
            <Link to="/recuperar" className="boton-primario mt-2">
              Pedir un enlace nuevo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="contenedor-app max-w-md py-10">
      <h1 className="titular">Elige tu nueva contrasena</h1>
      <p className="mt-2 text-sm text-piedra-600">
        Que sea facil de recordar para ti y dificil de adivinar para los demas.
      </p>

      <form onSubmit={enviar} className="tarjeta mt-6 space-y-4 p-5" noValidate>
        {error && <Aviso tipo="error">{error}</Aviso>}
        {listo && (
          <Aviso tipo="exito">
            Listo, tu contrasena quedo cambiada. Te llevamos a la pantalla de entrar.
          </Aviso>
        )}

        <div>
          <label className="etiqueta" htmlFor="clave-nueva">
            Contrasena nueva
          </label>
          <input
            id="clave-nueva"
            type="password"
            autoComplete="new-password"
            className="campo"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-terracota-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="etiqueta" htmlFor="clave-confirmacion">
            Escribela otra vez
          </label>
          <input
            id="clave-confirmacion"
            type="password"
            autoComplete="new-password"
            className="campo"
            {...register('confirmacion')}
          />
          {errors.confirmacion && (
            <p className="mt-1 text-sm text-terracota-600">{errors.confirmacion.message}</p>
          )}
        </div>

        <button type="submit" className="boton-primario w-full" disabled={isSubmitting || listo}>
          {isSubmitting ? 'Guardando...' : 'Guardar contrasena'}
        </button>
      </form>
    </div>
  );
}
