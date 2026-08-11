import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';
import { Marca } from './Marca';

export function Encabezado() {
  const { usuario, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();

  const cerrar = () => setAbierto(false);

  const cerrarSesion = () => {
    salir();
    cerrar();
    navegar('/');
  };

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
      isActive ? 'bg-terracota-50 text-terracota-700' : 'text-piedra-800 hover:bg-piedra-100'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-piedra-200 bg-white/95 backdrop-blur">
      <div className="contenedor-app flex h-16 items-center justify-between">
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
            <button type="button" onClick={cerrarSesion} className="boton-suave ml-2">
              Salir
            </button>
          ) : (
            <>
              <Link to="/entrar" className="boton-suave ml-2">
                Entrar
              </Link>
              <Link to="/registro" className="boton-primario">
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
                Panel de administracion
              </NavLink>
            )}

            <div className="space-y-2 pt-3">
              {usuario ? (
                <>
                  <p className="px-4 text-sm text-piedra-600">
                    Sesion de <strong className="text-piedra-900">{usuario.nombre}</strong>
                  </p>
                  <button type="button" onClick={cerrarSesion} className="boton-suave w-full">
                    Cerrar sesion
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
