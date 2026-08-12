import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { TipoInmueble } from '../lib/tipos';
import { Aviso } from './Estados';

/** Convierte los filtros de la barra de direcciones a lo que espera el servidor. */
function filtrosDesdeUrl(parametros: URLSearchParams) {
  const numero = (clave: string): number | undefined => {
    const valor = parametros.get(clave);
    if (valor === null || valor === '') return undefined;
    const n = Number(valor);
    return Number.isFinite(n) ? Math.floor(n) : undefined;
  };

  const texto = (clave: string): string | undefined => {
    const valor = parametros.get(clave)?.trim();
    return valor !== undefined && valor !== '' ? valor : undefined;
  };

  const servicios = (parametros.get('servicios') ?? '').split(',').filter(Boolean);
  const tipo = parametros.get('tipo');

  return {
    q: texto('q'),
    tipo: tipo !== null && tipo !== '' ? (tipo as TipoInmueble) : undefined,
    barrio: texto('barrio'),
    precioMin: numero('precioMin'),
    precioMax: numero('precioMax'),
    habitaciones: numero('habitaciones'),
    amoblado: parametros.get('amoblado') === 'true' ? true : undefined,
    servicios,
  };
}

/** Nombre sugerido a partir de lo que el estudiante esta filtrando. */
function nombreSugerido(parametros: URLSearchParams): string {
  const partes: string[] = [];
  const tipo = parametros.get('tipo');
  if (tipo === 'HABITACION') partes.push('Habitaciones');
  else if (tipo === 'APARTAESTUDIO') partes.push('Apartaestudios');
  else if (tipo === 'APARTAMENTO') partes.push('Apartamentos');
  else if (tipo === 'CASA') partes.push('Casas');
  else partes.push('Vivienda');

  const barrio = parametros.get('barrio');
  if (barrio) partes.push(`en ${barrio}`);

  const max = parametros.get('precioMax');
  if (max) {
    const miles = Math.round(Number(max) / 1000);
    if (Number.isFinite(miles)) partes.push(`hasta ${miles} mil`);
  }

  return partes.join(' ').slice(0, 60);
}

export function GuardarBusqueda() {
  const [parametros] = useSearchParams();
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [avisar, setAvisar] = useState(true);
  const [mensaje, setMensaje] = useState('');

  const guardar = useMutation({
    mutationFn: () =>
      pedir<{ mensaje: string }>('/api/busquedas', {
        metodo: 'POST',
        cuerpo: { nombre: nombre.trim(), avisarPorCorreo: avisar, ...filtrosDesdeUrl(parametros) },
      }),
    onSuccess: (r) => {
      setMensaje(r.mensaje);
      void clienteQuery.invalidateQueries({ queryKey: ['busquedas'] });
      window.setTimeout(() => {
        setAbierto(false);
        setMensaje('');
      }, 2600);
    },
    onError: (e) => setMensaje(e instanceof Error ? e.message : 'No pudimos guardarla.'),
  });

  const abrir = () => {
    if (!usuario) {
      navegar('/entrar', { state: { desde: `/?${parametros.toString()}` } });
      return;
    }
    setNombre(nombreSugerido(parametros));
    setMensaje('');
    setAbierto(true);
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        className="boton-suave shrink-0 text-sm"
        title="Te avisamos por correo cuando aparezca algo que encaje"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M10 2a5 5 0 0 0-5 5c0 3-1.2 4.2-1.8 4.8a.8.8 0 0 0 .55 1.35h12.5a.8.8 0 0 0 .55-1.35C16.2 11.2 15 10 15 7a5 5 0 0 0-5-5Zm0 16a2.6 2.6 0 0 0 2.5-1.85h-5A2.6 2.6 0 0 0 10 18Z" />
        </svg>
        Avisarme si aparece algo
      </button>
    );
  }

  return (
    <div className="tarjeta mt-3 space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-piedra-900">Guardar esta búsqueda</h3>
          <p className="mt-1 text-sm text-piedra-600">
            Guardamos los filtros que tienes puestos ahora mismo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-piedra-600 hover:bg-piedra-100"
        >
          ×
        </button>
      </div>

      {mensaje && <Aviso tipo={guardar.isError ? 'error' : 'exito'}>{mensaje}</Aviso>}

      <div>
        <label className="etiqueta" htmlFor="nombre-busqueda">
          Ponle un nombre
        </label>
        <input
          id="nombre-busqueda"
          className="campo"
          maxLength={60}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-piedra-800">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-piedra-300 text-terracota-500 focus:ring-terracota-500"
          checked={avisar}
          onChange={(e) => setAvisar(e.target.checked)}
        />
        Avisarme por correo cuando aparezca algo que encaje
      </label>

      <button
        type="button"
        className="boton-primario w-full"
        disabled={guardar.isPending || nombre.trim().length < 3}
        onClick={() => guardar.mutate()}
      >
        {guardar.isPending ? 'Guardando...' : 'Guardar búsqueda'}
      </button>
    </div>
  );
}
