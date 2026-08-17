import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pedir } from '../lib/api';
import { Aviso } from '../components/Estados';

const esquema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo.').email('Ese correo no parece válido.'),
});

type Datos = z.infer<typeof esquema>;

export function Recuperar() {
  const [mensaje, setMensaje] = useState('');
  const [fallo, setFallo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema) });

  const enviar = handleSubmit(async (datos) => {
    setMensaje('');
    setFallo(false);
    try {
      const r = await pedir<{ mensaje: string }>('/api/auth/recuperar', {
        metodo: 'POST',
        cuerpo: { email: datos.email },
      });
      setMensaje(r.mensaje);
    } catch (e) {
      setFallo(true);
      setMensaje(e instanceof Error ? e.message : 'No pudimos enviar el correo.');
    }
  });

  return (
    <div className="contenedor-app max-w-md py-10">
      <h1 className="titular">Olvidaste tu contraseña?</h1>
      <p className="mt-2 text-sm text-piedra-600">
        Escribe el correo con el que te registraste y te mandamos un enlace para cambiarla.
      </p>

      <form onSubmit={enviar} className="tarjeta mt-6 space-y-4 p-5" noValidate>
        {mensaje && <Aviso tipo={fallo ? 'error' : 'exito'}>{mensaje}</Aviso>}

        <div>
          <label className="etiqueta" htmlFor="email-recuperar">
            Correo electrónico
          </label>
          <input
            id="email-recuperar"
            type="email"
            autoComplete="email"
            className="campo"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-terracota-600">{errors.email.message}</p>}
        </div>

        <button type="submit" className="boton-primario w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviarme el enlace'}
        </button>

        <p className="text-center text-sm text-piedra-600">
          <Link to="/entrar" className="font-semibold text-confianza-600 underline">
            Volver a entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
