import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pedir } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { Aviso } from './Estados';

/**
 * Pide el celular ahi mismo, cuando de verdad hace falta.
 *
 * Ya no se pide al crear la cuenta: alguien que solo viene a mirar
 * habitaciones no tiene por que dar su numero. Pero para publicar si hace
 * falta, porque sin el la publicacion sale y nadie puede escribirle a quien
 * la puso. Si ya lo tiene registrado, este bloque no aparece.
 */
export function PedirCelular() {
  const { usuario, refrescar } = useSesion();
  const [celular, setCelular] = useState('');
  const [error, setError] = useState('');

  const guardar = useMutation({
    mutationFn: () => pedir('/api/auth/yo', { metodo: 'PATCH', cuerpo: { telefono: celular } }),
    onSuccess: () => {
      setError('');
      void refrescar();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'No pudimos guardarlo.'),
  });

  if (usuario === null) return null;
  if ((usuario.telefono ?? '') !== '') return null;

  return (
    <div className="rounded-xl border border-terracota-200 bg-terracota-50 p-4">
      <h3 className="font-bold text-piedra-900">Falta tu celular</h3>
      <p className="mt-1 text-sm text-piedra-800">
        Sin él, los estudiantes no van a poder escribirte. Solo se lo mostramos a quien pulsa
        Contactar.
      </p>

      {error !== '' && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="campo flex-1"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="3001234567"
          maxLength={10}
          value={celular}
          onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
        />
        <button
          type="button"
          className="boton-confianza"
          disabled={guardar.isPending || celular.length !== 10}
          onClick={() => guardar.mutate()}
        >
          {guardar.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
