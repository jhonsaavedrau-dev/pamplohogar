import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { Cargando } from '../components/Estados';
import { IconoMarca } from '../components/Marca';

type Estado = 'confirmando' | 'listo' | 'fallo';

export function ConfirmarCorreo() {
  const [parametros] = useSearchParams();
  const { refrescar } = useSesion();
  const token = parametros.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>('confirmando');
  const [mensaje, setMensaje] = useState('');
  const yaIntento = useRef(false);

  useEffect(() => {
    // React monta dos veces en desarrollo; sin esto el enlace se gastaria solo.
    if (yaIntento.current) return;
    yaIntento.current = true;

    if (token === '') {
      setEstado('fallo');
      setMensaje('Este enlace esta incompleto. Abrelo tal cual te llego al correo.');
      return;
    }

    void (async () => {
      try {
        const r = await pedir<{ mensaje: string }>('/api/auth/verificar/confirmar', {
          metodo: 'POST',
          cuerpo: { token },
        });
        setMensaje(r.mensaje);
        setEstado('listo');
        await refrescar();
      } catch (e) {
        setMensaje(e instanceof Error ? e.message : 'No pudimos confirmar tu correo.');
        setEstado('fallo');
      }
    })();
  }, [token, refrescar]);

  if (estado === 'confirmando') return <Cargando texto="Confirmando tu correo..." />;

  return (
    <div className="contenedor-app flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <IconoMarca
        className={`h-16 w-16 ${estado === 'listo' ? 'text-terracota-500' : 'text-piedra-200'}`}
      />
      <h1 className="titular">
        {estado === 'listo' ? 'Correo confirmado' : 'No pudimos confirmarlo'}
      </h1>
      <p className="text-piedra-600">{mensaje}</p>
      <Link to="/" className="boton-primario mt-2">
        Ir a buscar vivienda
      </Link>
    </div>
  );
}
