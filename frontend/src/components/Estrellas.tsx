interface Props {
  valor: number;
  total?: number;
  tamano?: 'sm' | 'md';
}

export function Estrellas({ valor, total, tamano = 'sm' }: Props) {
  const clase = tamano === 'md' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            viewBox="0 0 24 24"
            className={`${clase} ${n <= Math.round(valor) ? 'text-terracota-500' : 'text-piedra-200'}`}
            fill="currentColor"
          >
            <path d="m12 17.3-6.2 3.6 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7z" />
          </svg>
        ))}
      </span>
      <span className="text-sm text-piedra-600">
        {valor > 0 ? valor.toFixed(1) : 'Sin calificar'}
        {total !== undefined && total > 0 ? ` (${total})` : ''}
      </span>
    </span>
  );
}

interface PropsSelector {
  valor: number;
  alCambiar: (valor: number) => void;
}

export function SelectorEstrellas({ valor, alCambiar }: PropsSelector) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => alCambiar(n)}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          className="p-1"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-9 w-9 transition-colors ${n <= valor ? 'text-terracota-500' : 'text-piedra-200'}`}
            fill="currentColor"
          >
            <path d="m12 17.3-6.2 3.6 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
