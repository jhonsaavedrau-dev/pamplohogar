import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fotoDeAncho } from '../lib/fotos';
import { Aviso } from './Estados';

/**
 * La foto y las lineas que cuentan quien es cada quien.
 *
 * Nada de esto es obligatorio: se puede buscar habitacion sin llenar un
 * perfil. Pero para un arrendador, tener cara y unas lineas cambia mucho a
 * quien esta decidiendo si le escribe o no a un desconocido.
 */
export function MiPerfil() {
  const { usuario, refrescar } = useSesion();
  const archivoRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion ?? '');
  const [mensaje, setMensaje] = useState('');
  const [huboError, setHuboError] = useState(false);

  const avisar = (texto: string, error = false) => {
    setMensaje(texto);
    setHuboError(error);
  };

  const subirFoto = useMutation({
    mutationFn: async (archivo: File) => {
      const formulario = new FormData();
      formulario.append('foto', archivo);
      const r = await pedir<{ foto: { url: string; publicId: string } }>(
        '/api/subidas/foto-de-perfil',
        { metodo: 'POST', formulario },
      );
      await pedir('/api/auth/yo', {
        metodo: 'PATCH',
        cuerpo: { foto: r.foto.url, fotoId: r.foto.publicId },
      });
    },
    onSuccess: () => {
      avisar('Foto actualizada.');
      void refrescar();
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'No pudimos subir la foto.', true),
  });

  const quitarFoto = useMutation({
    mutationFn: () =>
      pedir('/api/auth/yo', { metodo: 'PATCH', cuerpo: { foto: '', fotoId: '' } }),
    onSuccess: () => {
      avisar('Foto quitada.');
      void refrescar();
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'No pudimos quitarla.', true),
  });

  const guardar = useMutation({
    mutationFn: () =>
      pedir('/api/auth/yo', { metodo: 'PATCH', cuerpo: { nombre, telefono, descripcion } }),
    onSuccess: () => {
      avisar('Listo, tu perfil quedó guardado.');
      void refrescar();
    },
    onError: (e) => avisar(e instanceof Error ? e.message : 'No pudimos guardarlo.', true),
  });

  if (usuario === null) return null;

  const iniciales = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <section className="tarjeta space-y-5 p-5">
      <div>
        <h2 className="text-lg font-bold text-piedra-900">Mi perfil</h2>
        <p className="mt-1 text-sm text-piedra-700">
          Así te ven los demás. Nada de esto es obligatorio, pero una cara y dos líneas ayudan a que
          te escriban.
        </p>
      </div>

      {mensaje !== '' && <Aviso tipo={huboError ? 'error' : 'exito'}>{mensaje}</Aviso>}

      <div className="flex flex-wrap items-center gap-4">
        {usuario.foto !== null && usuario.foto !== '' ? (
          <img
            src={fotoDeAncho(usuario.foto, 200)}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-terracota-100 text-2xl font-bold text-terracota-700">
            {iniciales}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={archivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirFoto.mutate(archivo);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="boton-suave"
            disabled={subirFoto.isPending}
            onClick={() => archivoRef.current?.click()}
          >
            {subirFoto.isPending ? 'Subiendo...' : usuario.foto ? 'Cambiar foto' : 'Poner foto'}
          </button>

          {usuario.foto !== null && usuario.foto !== '' && (
            <button
              type="button"
              className="boton-suave text-terracota-700"
              disabled={quitarFoto.isPending}
              onClick={() => quitarFoto.mutate()}
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="perfil-nombre">
          Nombre
        </label>
        <input
          id="perfil-nombre"
          className="campo"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        {/* Solo el nombre de pila sale publicado, pero el completo sirve para
            los recibos y para que un administrador sepa con quien habla. */}
        <p className="mt-1 text-xs text-piedra-600">
          A los demás solo les mostramos tu primer nombre.
        </p>
      </div>

      <div>
        <label className="etiqueta" htmlFor="perfil-celular">
          Celular
        </label>
        <input
          id="perfil-celular"
          className="campo"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="3001234567"
          maxLength={10}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
        />
        <p className="mt-1 text-xs text-piedra-600">
          Solo se lo mostramos a quien pulsa Contactar. Si publicas vivienda, sin él nadie puede
          escribirte.
        </p>
      </div>

      <div>
        <label className="etiqueta" htmlFor="perfil-descripcion">
          Algo sobre ti
        </label>
        <textarea
          id="perfil-descripcion"
          className="campo min-h-28 py-3"
          rows={3}
          maxLength={400}
          placeholder={
            usuario.rol === 'ARRENDADOR'
              ? 'Hace cuánto arriendas, cómo te gusta tratar con los estudiantes, qué esperas de quien vive ahí.'
              : 'Qué estudias, en qué semestre vas, qué buscas.'
          }
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <p className="mt-1 text-xs text-piedra-600">{descripcion.length} de 400 caracteres.</p>
      </div>

      <button
        type="button"
        className="boton-primario w-full"
        disabled={guardar.isPending || nombre.trim().length < 3}
        onClick={() => guardar.mutate()}
      >
        {guardar.isPending ? 'Guardando...' : 'Guardar mi perfil'}
      </button>
    </section>
  );
}
