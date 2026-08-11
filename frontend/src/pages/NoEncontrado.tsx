import { Link } from 'react-router-dom';
import { IconoMarca } from '../components/Marca';

export function NoEncontrado() {
  return (
    <div className="contenedor-app flex flex-col items-center gap-4 py-24 text-center">
      <IconoMarca className="h-16 w-16 text-piedra-200" />
      <h1 className="text-2xl font-extrabold text-piedra-900">Esta pagina no existe</h1>
      <p className="max-w-sm text-piedra-600">
        Puede que el enlace este mal escrito o que el inmueble ya no este publicado.
      </p>
      <Link to="/" className="boton-primario mt-2">
        Ir a buscar vivienda
      </Link>
    </div>
  );
}
