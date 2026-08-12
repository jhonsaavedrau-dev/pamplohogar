import { Link } from 'react-router-dom';
import { Marca } from './Marca';

export function PiePagina() {
  return (
    <footer className="sin-imprimir mt-20 border-t border-piedra-200 bg-white">
      <div className="contenedor-app py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <Marca conLema />
            <p className="mt-3 text-sm leading-relaxed text-piedra-600">
              Vivienda estudiantil en Pamplona, Norte de Santander. Para que encontrar donde vivir
              no dependa de a quien conozcas.
            </p>
          </div>

          <nav className="flex gap-12 text-sm">
            <div>
              <p className="mb-3 text-xs font-bold tracking-wide text-piedra-600 uppercase">
                Estudiantes
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-piedra-700 hover:text-terracota-600">
                    Buscar vivienda
                  </Link>
                </li>
                <li>
                  <Link to="/comparar" className="text-piedra-700 hover:text-terracota-600">
                    Comparar
                  </Link>
                </li>
                <li>
                  <Link to="/roomies" className="text-piedra-700 hover:text-terracota-600">
                    Buscar roomie
                  </Link>
                </li>
                <li>
                  <Link to="/favoritos" className="text-piedra-700 hover:text-terracota-600">
                    Mis favoritos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold tracking-wide text-piedra-600 uppercase">
                Arrendadores
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/registro" className="text-piedra-700 hover:text-terracota-600">
                    Publicar inmueble
                  </Link>
                </li>
                <li>
                  <Link to="/mis-inmuebles" className="text-piedra-700 hover:text-terracota-600">
                    Mis inmuebles
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <p className="mt-10 border-t border-piedra-100 pt-6 text-xs text-piedra-600">
          Verifica siempre el inmueble en persona antes de entregar dinero. PamploHogar conecta
          estudiantes con arrendadores, pero no participa en los acuerdos entre ustedes.
        </p>
      </div>
    </footer>
  );
}
