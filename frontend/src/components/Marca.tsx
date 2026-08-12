import { useId } from 'react';

/**
 * Emblema de PamploHogar: la casa que enmarca la iglesia del centro, las
 * montanas del valle, el sol y una vivienda pequena, con el brote al pie.
 *
 * Va en SVG y no como imagen para que se vea nitido en cualquier pantalla y
 * a cualquier tamano, y para que pese unos pocos kilobytes.
 */
export function IconoMarca({ className = 'h-8 w-8' }: { className?: string }) {
  // Cada instancia necesita su propio recorte: si dos comparten identificador,
  // el navegador aplica el primero a todas y algunas salen en blanco.
  const recorte = `dentroDeLaCasa-${useId()}`;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
      <defs>
        <clipPath id={recorte}>
          <path d="M50 15 84 35.5V70a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5V35.5Z" />
        </clipPath>
      </defs>

      <rect x="68" y="12" width="8" height="16" rx="2" fill="#C05621" />

      <g clipPath={`url(#${recorte})`}>
        <rect x="14" y="12" width="72" height="66" fill="#FDFAF6" />
        <circle cx="63" cy="38" r="8.5" fill="#E8843C" />
        <path d="M14 78V60l11-12 9 10 10-12 13 15 12-9 17 16v10Z" fill="#E2CFBA" />
        <path d="M14 78V66l13-10 12 12 11-8 15 14 21-12v16Z" fill="#D3BCA2" />

        <path d="M27 30h11v34H27Z" fill="#FDFAF6" />
        <path d="M27 30c0-7 2.5-11 5.5-11S38 23 38 30Z" fill="#FDFAF6" />
        <path d="M32.5 12v7M29.5 15h6" stroke="#3B2A20" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M32.5 36c1.8 0 3 1.4 3 3.2V45h-6v-5.8c0-1.8 1.2-3.2 3-3.2Z" fill="#3B2A20" />
        <path d="M22 64V47h6v17Z" fill="#F2E7D8" />

        <path d="M44 60 56 50l12 10Z" fill="#A8461A" />
        <path d="M47 60h18v15H47Z" fill="#FDFAF6" />
        <path d="M52.5 64h7v7h-7Z" fill="#3B2A20" />
      </g>

      <path
        d="M50 15 84 35.5V70a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5V35.5Z"
        fill="none"
        stroke="#C05621"
        strokeWidth="6.5"
        strokeLinejoin="round"
      />

      <path d="M79 74c6.5 0 11-4.2 11-10.5-6.5 0-11 4.2-11 10.5Z" fill="#C05621" />
      <path d="M79 74c-3.5-5.4-2.2-11.3 3.2-14.6C85.7 64.8 84.4 70.7 79 74Z" fill="#D2691E" />
    </svg>
  );
}

interface PropsMarca {
  compacta?: boolean;
  /** El lema solo cabe en el pie de pagina y en pantallas grandes. */
  conLema?: boolean;
}

export function Marca({ compacta = false, conLema = false }: PropsMarca) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <IconoMarca className="h-10 w-10 shrink-0" />

      {!compacta && (
        <span className="flex flex-col leading-none">
          <span className="font-titulo text-[1.4rem] font-semibold tracking-tight text-piedra-900">
            Pamplo<span className="text-terracota-600">Hogar</span>
          </span>
          {conLema && (
            <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.18em] text-piedra-600 uppercase">
              Tu lugar en Pamplona
            </span>
          )}
        </span>
      )}
    </span>
  );
}
