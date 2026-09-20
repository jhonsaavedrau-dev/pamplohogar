import { Link } from 'react-router-dom';

/*
  La ventana vacia: un cuarto que no esta, en vez del logo apagado en gris, que
  se leia como que la pagina entera se habia caido.
*/
export function NoEncontrado() {
  return (
    <div className="contenedor-app flex flex-col items-center gap-4 py-16 text-center sm:py-20">
      <img
        src="/fotos/ventana-vacia.webp"
        alt=""
        width={1200}
        height={675}
        className="mb-4 aspect-[16/10] w-full max-w-lg rounded-t-[999px] rounded-b-3xl object-cover shadow-[0_30px_60px_-30px_rgba(100,45,14,0.45)]"
      />
      <h1 className="titular">Esta página no existe</h1>
      <p className="max-w-sm text-piedra-600">
        Puede que el enlace esté mal escrito o que el inmueble ya no esté publicado.
      </p>
      <Link to="/" className="boton-primario mt-2">
        Ir a buscar vivienda
      </Link>
    </div>
  );
}
