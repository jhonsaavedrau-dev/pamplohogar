export function IconoMarca({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <path d="M32 6 6 27v29a3 3 0 0 0 3 3h46a3 3 0 0 0 3-3V27L32 6Z" fill="currentColor" />
      <circle cx="32" cy="36" r="7" fill="#FFF7F0" />
      <path d="M32 42v10m0-4h5" stroke="#FFF7F0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="2.6" fill="currentColor" />
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
