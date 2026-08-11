import { Link } from 'react-router-dom';
import { IconoMarca } from './Marca';

export function PiePagina() {
  return (
    <footer className="mt-16 border-t border-piedra-200 bg-white">
      <div className="contenedor-app flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconoMarca className="h-9 w-9 text-terracota-500" />
          <div>
            <p className="font-bold text-piedra-900">PamploHogar</p>
            <p className="text-sm text-piedra-600">
              Vivienda estudiantil en Pamplona, Norte de Santander
            </p>
          </div>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-piedra-600">
          <Link to="/" className="hover:text-terracota-600">
            Buscar
          </Link>
          <Link to="/registro" className="hover:text-terracota-600">
            Publicar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
