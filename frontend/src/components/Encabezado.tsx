import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSesion } from '../lib/sesion';
import { pedir } from '../lib/api';
import { Marca } from './Marca';

/** El punto rojo con los mensajes sin leer, al lado del enlace. */
function PuntoSinLeer({ cuantos }: { cuantos: number }) {
  if (cuantos === 0) return null;
  return (
    <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-terracota-600 px-1 text-xs font-bold text-white">
      {cuantos > 9 ? '9+' : cuantos}
    </span>
  );
}

/*
  El menu de la cuenta propia, en el computador.

  La barra llegaba a nueve enlaces en fila y todos pesaban igual: buscar
  vivienda competia con cerrar sesion. Lo que uno usa a cada rato queda a la
  vista y lo de la cuenta se recoge aqui, que es donde la gente ya lo busca.
*/
function MenuDeCuenta({
  nombre,
  children,
}: {
  nombre: string;
  children: (cerrar: () => void) => React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape: si no, queda abierto tapando la
  // pantalla y toca adivinar que hay que volver a pulsar el mismo boton.
  useEffect(() => {
    if (!abierto) return;
    const alPulsarFuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsarFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-[0.95rem] font-semibold transition-colors ${
          abierto ? 'bg-piedra-100 text-piedra-900' : 'text-piedra-700 hover:bg-piedra-100'
        }`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-terracota-100 text-xs font-bold text-terracota-700">
          {nombre.trim().charAt(0).toUpperCase()}
        </span>
        {nombre.split(' ')[0]}
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-piedra-500" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-piedra-200 bg-white py-1.5 shadow-[var(--shadow-elevada)]"
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}

export function Encabezado() {
  const { usuario, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const [bajado, setBajado] = useState(false);
  const navegar = useNavigate();

  // El encabezado siempre es solido: transparente solo se veria bien sobre la
  // portada, y en pantallas como entrar o el panel quedaria flotando sin borde.
  // Lo unico que cambia al bajar es la sombra, que lo despega del contenido.
  useEffect(() => {
    const alDesplazar = () => setBajado(window.scrollY > 16);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  // Se revisa cada medio minuto: lo justo para enterarse sin estar
  // preguntandole al servidor todo el tiempo desde cada pestana abierta.
  const { data: correo } = useQuery({
    queryKey: ['mensajesSinLeer'],
    queryFn: () => pedir<{ sinLeer: number }>('/api/mensajes/sin-leer'),
    enabled: usuario !== null,
    refetchInterval: 30000,
  });
  const sinLeer = correo?.sinLeer ?? 0;

  const cerrar = () => setAbierto(false);

  const cerrarSesion = () => {
    salir();
    cerrar();
    navegar('/');
  };

  /*
    En que pantalla estas se veia solo por el color de la letra, y entre el
    gris oscuro y el terracota hay poca diferencia de un vistazo. Ahora la
    pantalla en la que estas va dentro de una pastilla de color: se ve sin
    leer, que es como uno mira una barra de menu.
  */
  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `enlace-menu flex min-h-10 items-center rounded-lg px-3.5 text-[0.95rem] font-semibold transition-colors ${
      isActive
        ? 'bg-terracota-50 text-terracota-700'
        : 'text-piedra-700 hover:bg-piedra-100 hover:text-piedra-900'
    }`;

  /** Raya fina que separa lo de todos de lo de tu cuenta. */
  const Separador = () => (
    <span aria-hidden="true" className="mx-2 h-6 w-px shrink-0 bg-piedra-200" />
  );

  /** Cada renglon dentro del menu de cuenta. */
  const claseEnMenu = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center px-4 text-[0.95rem] font-semibold transition-colors ${
      isActive ? 'bg-terracota-50 text-terracota-700' : 'text-piedra-700 hover:bg-piedra-50'
    }`;

  /*
    En el celular los renglones del menu son mas altos que en el computador.
    Los de arriba miden 38 puntos y el minimo comodo para un dedo son 44: por
    eso se le daba al de al lado. Aqui van 48, ocupan todo el ancho y se
    pintan enteros al pulsarlos, para que se vea cual se toco.
  */
  const claseEnlaceMovil = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 items-center rounded-xl px-4 text-[1.02rem] font-semibold transition-colors ${
      isActive ? 'bg-terracota-50 text-terracota-700' : 'text-piedra-800 active:bg-piedra-100'
    }`;

  /** Titulo de cada grupo del menu del celular. */
  const Grupo = ({ titulo }: { titulo: string }) => (
    <p className="px-4 pt-4 pb-1 text-[0.68rem] font-bold tracking-[0.12em] text-piedra-500 uppercase">
      {titulo}
    </p>
  );

  return (
    <header
      className={`sin-imprimir sticky top-0 z-30 border-b border-piedra-200/70 bg-white/90 backdrop-blur-md transition-shadow duration-300 ease-[var(--ease-suave)] ${
        bajado ? 'shadow-[0_4px_16px_-6px_rgba(31,27,23,0.16)]' : 'shadow-none'
      }`}
    >
      <div className="contenedor-app flex h-[4.5rem] items-center justify-between">
        <Link to="/" onClick={cerrar} aria-label="Ir al inicio de PamploHogar">
          <Marca />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={claseEnlace} end>
            Buscar
          </NavLink>
          <NavLink to="/roomies" className={claseEnlace}>
            Roomies
          </NavLink>
          <NavLink to="/mapa-de-precios" className={claseEnlace}>
            Precios
          </NavLink>
          {usuario ? (
            <>
              <Separador />

              {/* Mensajes se queda a la vista aunque haya menu de cuenta: es
                  lo unico que cambia solo y necesita verse el punto rojo sin
                  abrir nada. */}
              <NavLink to="/mensajes" className={claseEnlace}>
                Mensajes
                <PuntoSinLeer cuantos={sinLeer} />
              </NavLink>

              {usuario.rol === 'ARRENDADOR' && (
                <Link to="/publicar" className="boton-primario ml-1 min-h-10 px-4 text-[0.95rem]">
                  Publicar
                </Link>
              )}

              <MenuDeCuenta nombre={usuario.nombre}>
                {(cerrarMenu) => (
                  <>
                    <NavLink to="/favoritos" className={claseEnMenu} onClick={cerrarMenu}>
                      Mis favoritos
                    </NavLink>
                    <NavLink to="/busquedas" className={claseEnMenu} onClick={cerrarMenu}>
                      Mis búsquedas
                    </NavLink>
                    {usuario.rol === 'ARRENDADOR' && (
                      <NavLink to="/mis-inmuebles" className={claseEnMenu} onClick={cerrarMenu}>
                        Mis inmuebles
                      </NavLink>
                    )}
                    {usuario.rol === 'ADMIN' && (
                      <NavLink to="/admin" className={claseEnMenu} onClick={cerrarMenu}>
                        Panel de administración
                      </NavLink>
                    )}
                    <NavLink to="/mi-cuenta" className={claseEnMenu} onClick={cerrarMenu}>
                      Mi cuenta
                    </NavLink>

                    <div className="my-1.5 border-t border-piedra-100" />
                    <button
                      type="button"
                      onClick={() => {
                        cerrarMenu();
                        cerrarSesion();
                      }}
                      className="flex w-full min-h-11 items-center px-4 text-left text-[0.95rem] font-semibold text-piedra-600 transition-colors hover:bg-piedra-50 hover:text-piedra-900"
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </MenuDeCuenta>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                className="ml-3 min-h-11 rounded-lg px-3.5 py-2 text-[0.95rem] font-semibold text-piedra-700 transition-colors hover:bg-piedra-100"
              >
                Entrar
              </Link>
              <Link to="/registro" className="boton-primario ml-1 min-h-11 px-4 text-[0.95rem]">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar menu' : 'Abrir menu'}
          className="grid h-11 w-11 place-items-center rounded-xl border border-piedra-200 md:hidden"
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-piedra-800" />
            <span className="block h-0.5 w-5 bg-piedra-800" />
            <span className="block h-0.5 w-5 bg-piedra-800" />
          </span>
        </button>
      </div>

      {abierto && (
        <div className="border-t border-piedra-200 bg-white md:hidden">
          {/*
            Antes era una sola lista de hasta nueve renglones seguidos, sin
            separacion: buscar vivienda y cerrar sesion se veian igual de
            importantes. Ahora va en grupos, primero lo que hace cualquiera y
            despues lo de la cuenta propia, que es lo que se usa de vez en
            cuando.
          */}
          <nav className="contenedor-app space-y-0.5 pt-1 pb-4">
            <Grupo titulo="Buscar" />
            <NavLink to="/" className={claseEnlaceMovil} onClick={cerrar} end>
              Buscar vivienda
            </NavLink>
            <NavLink to="/roomies" className={claseEnlaceMovil} onClick={cerrar}>
              Buscar roomie
            </NavLink>
            <NavLink to="/mapa-de-precios" className={claseEnlaceMovil} onClick={cerrar}>
              Mapa de precios
            </NavLink>

            {usuario && (
              <>
                <Grupo titulo="Lo mío" />
                <NavLink to="/mensajes" className={claseEnlaceMovil} onClick={cerrar}>
                  Mis mensajes
                  <PuntoSinLeer cuantos={sinLeer} />
                </NavLink>
                <NavLink to="/favoritos" className={claseEnlaceMovil} onClick={cerrar}>
                  Mis favoritos
                </NavLink>
                <NavLink to="/busquedas" className={claseEnlaceMovil} onClick={cerrar}>
                  Mis búsquedas
                </NavLink>
                <NavLink to="/mi-cuenta" className={claseEnlaceMovil} onClick={cerrar}>
                  Mi cuenta
                </NavLink>
              </>
            )}

            {usuario?.rol === 'ARRENDADOR' && (
              <>
                <Grupo titulo="Mis inmuebles" />
                <NavLink to="/mis-inmuebles" className={claseEnlaceMovil} onClick={cerrar}>
                  Ver mis inmuebles
                </NavLink>
                <NavLink to="/publicar" className={claseEnlaceMovil} onClick={cerrar}>
                  Publicar inmueble
                </NavLink>
              </>
            )}

            {usuario?.rol === 'ADMIN' && (
              <>
                <Grupo titulo="Administración" />
                <NavLink to="/admin" className={claseEnlaceMovil} onClick={cerrar}>
                  Panel de administración
                </NavLink>
              </>
            )}

            <div className="space-y-2 pt-5">
              {usuario ? (
                <>
                  <p className="px-4 text-sm text-piedra-600">
                    Sesión de <strong className="text-piedra-900">{usuario.nombre}</strong>
                  </p>
                  <button type="button" onClick={cerrarSesion} className="boton-suave w-full">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/entrar" onClick={cerrar} className="boton-suave w-full">
                    Entrar
                  </Link>
                  <Link to="/registro" onClick={cerrar} className="boton-primario w-full">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
