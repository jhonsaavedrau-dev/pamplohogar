import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { fechaCorta } from '../../lib/formato';
import { Cargando, EstadoError, EstadoVacio } from '../Estados';

interface ResumenAdmin {
  id: string;
  inmuebleId: string;
  inmuebleTitulo: string;
  estudiante: string;
  arrendador: string;
  mensajes: number;
  ultimoEn: string;
}

interface HiloAdmin {
  conversacion: {
    id: string;
    inmueble: { id: string; titulo: string };
    estudiante: string;
    arrendador: string;
  };
  mensajes: {
    id: string;
    texto: string;
    creadoEn: string;
    deQuien: 'estudiante' | 'arrendador';
    leido: boolean;
  }[];
}

const fechaYHora = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export function ConversacionesAdmin() {
  const [busqueda, setBusqueda] = useState('');
  const [texto, setTexto] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  const lista = useQuery({
    queryKey: ['admin', 'conversaciones', busqueda],
    queryFn: () =>
      pedir<{ conversaciones: ResumenAdmin[] }>(
        `/api/admin/conversaciones${busqueda ? `?q=${encodeURIComponent(busqueda)}` : ''}`,
      ),
  });

  const hilo = useQuery({
    queryKey: ['admin', 'conversacion', abierta],
    queryFn: () => pedir<HiloAdmin>(`/api/admin/conversaciones/${abierta}`),
    enabled: abierta !== null,
  });

  if (lista.isPending) return <Cargando texto="Cargando conversaciones..." />;
  if (lista.isError || !lista.data) {
    return (
      <EstadoError
        mensaje={
          lista.error instanceof Error ? lista.error.message : 'No pudimos cargar las conversaciones.'
        }
        alReintentar={() => void lista.refetch()}
      />
    );
  }

  if (abierta !== null) {
    return (
      <div className="space-y-4">
        <button type="button" className="boton-suave" onClick={() => setAbierta(null)}>
          Volver a la lista
        </button>

        {hilo.isPending && <Cargando texto="Abriendo la conversación..." />}

        {hilo.data && (
          <>
            <div className="tarjeta p-4">
              <p className="text-sm text-piedra-600">Sobre la publicación</p>
              <strong className="text-piedra-900">{hilo.data.conversacion.inmueble.titulo}</strong>
              <p className="mt-2 text-sm text-piedra-700">
                <strong>Estudiante:</strong> {hilo.data.conversacion.estudiante}
                <br />
                <strong>Arrendador:</strong> {hilo.data.conversacion.arrendador}
              </p>
            </div>

            <ul className="space-y-2">
              {hilo.data.mensajes.map((m) => (
                <li
                  key={m.id}
                  className={`tarjeta p-3 ${
                    m.deQuien === 'estudiante' ? '' : 'border-confianza-200 bg-confianza-50'
                  }`}
                >
                  <p className="text-xs font-semibold text-piedra-600">
                    {m.deQuien === 'estudiante' ? 'Estudiante' : 'Arrendador'} -{' '}
                    {fechaYHora(m.creadoEn)}
                    {!m.leido && ' - sin leer'}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-piedra-900">{m.texto}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-terracota-200 bg-terracota-50 px-4 py-3 text-sm text-piedra-800">
        Esto es correspondencia privada entre dos personas. Ábrela solo cuando haya un problema que
        atender. <strong>Cada vez que abres una queda anotado en el Registro</strong>, con quiénes
        hablaban y sobre qué inmueble, y a los usuarios se les avisa en el chat que esto puede pasar.
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setBusqueda(texto.trim());
        }}
      >
        <input
          className="campo flex-1"
          placeholder="Buscar por nombre, correo o publicación"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="boton-confianza">
          Buscar
        </button>
      </form>

      {lista.data.conversaciones.length === 0 ? (
        <EstadoVacio
          titulo={busqueda ? 'Sin resultados' : 'Todavía no hay conversaciones'}
          descripcion={
            busqueda
              ? 'Prueba con otro nombre, correo o título de publicación.'
              : 'Cuando los estudiantes empiecen a escribirle a los arrendadores, aparecerán aquí.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {lista.data.conversaciones.map((c) => (
            <li key={c.id} className="tarjeta p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <strong className="text-piedra-900">{c.inmuebleTitulo}</strong>
                  <p className="mt-1 text-sm text-piedra-700">
                    {c.estudiante} con {c.arrendador}
                  </p>
                  <p className="mt-1 text-xs text-piedra-500">
                    {c.mensajes} {c.mensajes === 1 ? 'mensaje' : 'mensajes'} - último el{' '}
                    {fechaCorta(c.ultimoEn)}
                  </p>
                </div>
                <button
                  type="button"
                  className="boton-suave shrink-0"
                  onClick={() => setAbierta(c.id)}
                >
                  Leer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
