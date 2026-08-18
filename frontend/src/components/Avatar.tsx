import { fotoDeAncho } from '../lib/fotos';

/*
  La cara de una persona.

  Cada pantalla lo resolvia por su cuenta: el chat no mostraba nada, el
  encabezado dibujaba la inicial en un circulo y la ficha del inmueble ponia la
  foto con otro borde y otro tamano. Tres maneras de dibujar lo mismo.

  Si hay foto se muestra la foto. Si no, la inicial sobre un color sacado del
  propio nombre: siempre el mismo color para la misma persona, asi que en una
  lista de conversaciones cada quien se reconoce por su mancha de color aunque
  ninguno tenga foto.
*/

const COLORES = [
  'bg-terracota-100 text-terracota-700',
  'bg-confianza-100 text-confianza-700',
  'bg-verificado-100 text-verificado-700',
  'bg-piedra-200 text-piedra-700',
];

/** Un numero estable a partir del nombre, para que el color no cambie. */
function colorDe(nombre: string): string {
  let suma = 0;
  for (const letra of nombre) suma += letra.codePointAt(0) ?? 0;
  return COLORES[suma % COLORES.length];
}

interface Props {
  nombre: string;
  foto?: string | null;
  /** Lado del circulo en pixeles. Por defecto 40, el de una lista. */
  tamano?: number;
  className?: string;
}

export function Avatar({ nombre, foto, tamano = 40, className = '' }: Props) {
  const estilo = { width: tamano, height: tamano };
  const comun = `shrink-0 rounded-full object-cover ${className}`;

  if (foto !== null && foto !== undefined && foto !== '') {
    return (
      <img
        src={fotoDeAncho(foto, tamano * 2)}
        alt=""
        style={estilo}
        className={`${comun} bg-piedra-100 ring-1 ring-piedra-200/70`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      style={{ ...estilo, fontSize: Math.round(tamano * 0.4) }}
      className={`grid place-items-center font-bold ${colorDe(nombre)} ${comun}`}
      aria-hidden="true"
    >
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  );
}
