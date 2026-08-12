import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';
import { Marca } from './Marca';

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

  const cerrar = () => setAbierto(false);

  const cerrarSesion = () => {
    salir();
    cerrar();
    navegar('/');
  };

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `enlace-menu block rounded-lg px-3.5 py-2 text-[0.95rem] font-semibold transition-colors ${
      isActive ? 'text-terracota-700' : 'text-piedra-700 hover:text-piedra-900'
    }`;

  return (
    <header
      className={`sticky top-0 z-30 border-b border-piedra-200/70 bg-white/90 backdrop-blur-md transition-shadow duration-300 ease-[var(--ease-suave)] ${
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
          {usuario && (
            <NavLink to="/favoritos" className={claseEnlace}>
              Favoritos
            </NavLink>
          )}
          {usuario?.rol === 'ARRENDADOR' && (
            <NavLink to="/mis-inmuebles" className={claseEnlace}>
              Mis inmuebles
            </NavLink>
          )}
          {usuario?.rol === 'ADMIN' && (
            <NavLink to="/admin" className={claseEnlace}>
              Panel
            </NavLink>
          )}
          {usuario ? (
            <button
              type="button"
              onClick={cerrarSesion}
              className="ml-3 min-h-11 rounded-lg px-3.5 text-[0.95rem] font-semibold text-piedra-600 transition-colors hover:bg-piedra-100 hover:text-piedra-900"
            >
              Salir
            </button>
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
          <nav className="contenedor-app space-y-1 py-3">
            <NavLink to="/" className={claseEnlace} onClick={cerrar} end>
              Buscar vivienda
            </NavLink>
            {usuario && (
              <NavLink to="/favoritos" className={claseEnlace} onClick={cerrar}>
                Mis favoritos
              </NavLink>
            )}
            {usuario?.rol === 'ARRENDADOR' && (
              <>
                <NavLink to="/mis-inmuebles" className={claseEnlace} onClick={cerrar}>
                  Mis inmuebles
                </NavLink>
                <NavLink to="/publicar" className={claseEnlace} onClick={cerrar}>
                  Publicar inmueble
                </NavLink>
              </>
            )}
            {usuario?.rol === 'ADMIN' && (
              <NavLink to="/admin" className={claseEnlace} onClick={cerrar}>
                Panel de administración
              </NavLink>
            )}

            <div className="space-y-2 pt-3">
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
