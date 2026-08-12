/**
 * Casa con puerta de arco.
 *
 * El arco es la forma que se repite en los portales del centro historico de
 * Pamplona, y de paso lee como puerta abierta. Va en una sola figura con el
 * hueco recortado de verdad, no pintado encima: asi se ve bien sobre
 * cualquier fondo y sigue siendo legible a 16 pixeles.
 */
export function IconoMarca({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M24 3.2 1.9 20.8a2.4 2.4 0 0 0-.9 1.9V40a5 5 0 0 0 5 5h36a5 5 0 0 0 5-5V22.7c0-.75-.34-1.45-.9-1.9L24 3.2Zm-6.6 41.8V34.2a6.6 6.6 0 0 1 13.2 0V45h-13.2Z"
      />
    </svg>
  );
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <IconoMarca className="h-9 w-9 text-terracota-500" />
      {!compacta && (
        <span className="font-titulo text-[1.35rem] leading-none font-semibold tracking-tight text-piedra-900">
          Pamplo<span className="text-terracota-600">Hogar</span>
        </span>
      )}
    </span>
  );
}
