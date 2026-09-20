import type { CSSProperties, ReactNode } from 'react';

interface Props {
  /** Ruta de la foto dentro de /public, por ejemplo '/fotos/llave.webp'. */
  foto: string;
  children: ReactNode;
}

/*
  Formulario a un lado y una foto al otro, para entrar y crear cuenta.

  En computador el formulario solo, centrado en una columna angosta, dejaba dos
  tercios de pantalla en blanco. En celular no cambia nada: la foto no se ve y
  tampoco se descarga, porque va como fondo y la regla del fondo solo existe
  desde el ancho lg. Nadie gasta datos en una foto que no ve.
*/
export function PantallaConFoto({ foto, children }: Props) {
  return (
    <div className="contenedor-app py-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-14">
      <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">{children}</div>
      <div
        aria-hidden="true"
        style={{ '--foto': `url('${foto}')` } as CSSProperties}
        className="hidden aspect-[3/4] max-h-[40rem] w-full max-w-md rounded-t-[999px] rounded-b-3xl bg-cover bg-center shadow-[0_30px_60px_-30px_rgba(100,45,14,0.45)] ring-1 ring-terracota-900/10 lg:block lg:[background-image:var(--foto)]"
      />
    </div>
  );
}
