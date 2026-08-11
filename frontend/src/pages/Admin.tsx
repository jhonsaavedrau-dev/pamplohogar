import { useState } from 'react';
import { useSesion } from '../lib/sesion';
import { Resumen } from '../components/admin/Resumen';
import { InmueblesAdmin } from '../components/admin/InmueblesAdmin';
import { UsuariosAdmin } from '../components/admin/UsuariosAdmin';
import { ResenasAdmin } from '../components/admin/ResenasAdmin';

const SECCIONES = [
  { clave: 'resumen', etiqueta: 'Resumen' },
  { clave: 'inmuebles', etiqueta: 'Inmuebles' },
  { clave: 'usuarios', etiqueta: 'Usuarios' },
  { clave: 'resenas', etiqueta: 'Resenas' },
] as const;

type Seccion = (typeof SECCIONES)[number]['clave'];

export function Admin() {
  const { usuario } = useSesion();
  const [seccion, setSeccion] = useState<Seccion>('resumen');

  return (
    <div className="contenedor-app py-8">
      <header className="mb-6">
        <span className="rounded-full bg-terracota-100 px-3 py-1 text-xs font-bold tracking-wide text-terracota-700 uppercase">
          Panel de administracion
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-piedra-900">
          Hola, {usuario?.nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-piedra-600">
          Desde aqui puedes ver como va la plataforma y retirar lo que no deberia estar publicado.
        </p>
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-piedra-200 pb-px">
        {SECCIONES.map((s) => (
          <button
            key={s.clave}
            type="button"
            onClick={() => setSeccion(s.clave)}
            aria-current={seccion === s.clave ? 'page' : undefined}
            className={`min-h-12 shrink-0 border-b-2 px-4 text-base font-semibold transition-colors ${
              seccion === s.clave
                ? 'border-terracota-500 text-terracota-700'
                : 'border-transparent text-piedra-600 hover:text-piedra-900'
            }`}
          >
            {s.etiqueta}
          </button>
        ))}
      </nav>

      {seccion === 'resumen' && <Resumen />}
      {seccion === 'inmuebles' && <InmueblesAdmin />}
      {seccion === 'usuarios' && <UsuariosAdmin />}
      {seccion === 'resenas' && <ResenasAdmin />}
    </div>
  );
}
