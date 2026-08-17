import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSesion } from '../lib/sesion';
import { pedir } from '../lib/api';

/*
  La barra de abajo, solo en el celular.

  Antes todo vivia detras del boton de las tres rayitas, arriba a la derecha:
  para ir a Roomies eran dos toques, y en la esquina donde peor llega el pulgar
  de una mano. Las pantallas que se usan todo el rato ahora estan siempre a la
  vista y al alcance del dedo.

  En el computador no aparece: alli el menu de arriba se ve entero y una barra
  pegada al fondo de una pantalla ancha estorba mas de lo que ayuda.

  Van cuatro y no mas. Con cinco o seis los iconos se aprietan y se vuelve a
  fallar el toque, que es justo lo que se estaba arreglando. El resto (mis
  favoritos, mis busquedas, mis inmuebles, el panel) sigue en el menu de
  arriba, que es donde se busca lo que se usa de vez en cuando.
*/

const ALTO = 'h-16';

function Icono({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" strokeWidth="1.9" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONOS = {
  buscar: (
    <Icono>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" />
    </Icono>
  ),
  roomies: (
    <Icono>
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" />
      <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" stroke="currentColor" strokeLinecap="round" />
      <path d="M16 6.5a3 3 0 0 1 0 5.6M17.5 14.6c2 .6 3.2 2.2 3.2 4.4" stroke="currentColor" strokeLinecap="round" />
    </Icono>
  ),
  precios: (
    <Icono>
      <path d="M4 19V9M10 19V5M16 19v-6M22 19H2" stroke="currentColor" strokeLinecap="round" />
    </Icono>
  ),
  mensajes: (
    <Icono>
      <path
        d="M20 12.5c0 3.6-3.6 6.5-8 6.5-.9 0-1.8-.1-2.6-.35L4 20.5l1.3-3.1C4.5 16.2 4 14.4 4 12.5 4 8.9 7.6 6 12 6s8 2.9 8 6.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </Icono>
  ),
  entrar: (
    <Icono>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" />
      <path d="M5 20c0-3.6 3.1-5.8 7-5.8s7 2.2 7 5.8" stroke="currentColor" strokeLinecap="round" />
    </Icono>
  ),
};

/** El punto con los mensajes sin leer, encima del icono. */
function PuntoSinLeer({ cuantos }: { cuantos: number }) {
  if (cuantos === 0) return null;
  return (
    <span className="absolute top-0 right-1/2 -mr-4 grid h-4 min-w-4 place-items-center rounded-full bg-terracota-600 px-1 text-[0.6rem] font-bold text-white">
      {cuantos > 9 ? '9+' : cuantos}
    </span>
  );
}

export function BarraInferior() {
  const { usuario } = useSesion();

  const { data } = useQuery({
    queryKey: ['mensajesSinLeer'],
    queryFn: () => pedir<{ sinLeer: number }>('/api/mensajes/sin-leer'),
    enabled: usuario !== null,
    refetchInterval: 30000,
  });
  const sinLeer = data?.sinLeer ?? 0;

  const clase = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold transition-colors ${
      isActive ? 'text-terracota-700' : 'text-piedra-600'
    }`;

  return (
    <>
      {/*
        Un hueco del mismo alto que la barra. Sin esto la barra tapa el final
        del pie de pagina y el enlace de privacidad queda debajo, invisible.
      */}
      <div aria-hidden="true" className={`${ALTO} md:hidden`} />

      <nav
        aria-label="Principal"
        className={`sin-imprimir fixed inset-x-0 bottom-0 z-40 flex ${ALTO} border-t border-piedra-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden`}
      >
        <NavLink to="/" className={clase} end>
          {ICONOS.buscar}
          Buscar
        </NavLink>
        <NavLink to="/roomies" className={clase}>
          {ICONOS.roomies}
          Roomies
        </NavLink>
        <NavLink to="/mapa-de-precios" className={clase}>
          {ICONOS.precios}
          Precios
        </NavLink>
        {usuario ? (
          <NavLink to="/mensajes" className={clase}>
            <PuntoSinLeer cuantos={sinLeer} />
            {ICONOS.mensajes}
            Mensajes
          </NavLink>
        ) : (
          <NavLink to="/entrar" className={clase}>
            {ICONOS.entrar}
            Entrar
          </NavLink>
        )}
      </nav>
    </>
  );
}
