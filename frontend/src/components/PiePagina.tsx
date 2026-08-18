import { Link } from 'react-router-dom';
import { Marca } from './Marca';


export function PiePagina() {
  return (
    <footer className="sin-imprimir mt-20 border-t border-piedra-200 bg-white">
      <div className="contenedor-app py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            {/*
              El logo del pie tambien lleva al inicio. Antes era solo un dibujo:
              quien llega al final de la pagina y quiere volver a empezar le
              pulsa, no pasa nada, y toca subir hasta arriba.
            */}
            <Link to="/" aria-label="Ir al inicio de PamploHogar" className="inline-block">
              <Marca conLema />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-piedra-600">
              Vivienda estudiantil en Pamplona, Norte de Santander. Para que encontrar donde vivir
              no dependa de a quien conozcas.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
            <div>
              <p className="mb-3 text-xs font-bold tracking-wide text-piedra-600 uppercase">
                Estudiantes
              </p>
              <ul className="space-y-1">
                <li>
                  <Link to="/" className="tocable text-piedra-700 hover:text-terracota-600">
                    Buscar vivienda
                  </Link>
                </li>
                <li>
                  <Link to="/comparar" className="tocable text-piedra-700 hover:text-terracota-600">
                    Comparar
                  </Link>
                </li>
                <li>
                  <Link to="/roomies" className="tocable text-piedra-700 hover:text-terracota-600">
                    Buscar roomie
                  </Link>
                </li>
                <li>
                  <Link to="/favoritos" className="tocable text-piedra-700 hover:text-terracota-600">
                    Mis favoritos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold tracking-wide text-piedra-600 uppercase">
                Arrendadores
              </p>
              <ul className="space-y-1">
                <li>
                  <Link to="/registro" className="tocable text-piedra-700 hover:text-terracota-600">
                    Publicar inmueble
                  </Link>
                </li>
                <li>
                  <Link to="/mis-inmuebles" className="tocable text-piedra-700 hover:text-terracota-600">
                    Mis inmuebles
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-piedra-100 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className="max-w-xl text-xs text-piedra-600">
            Verifica siempre el inmueble en persona antes de entregar dinero. PamploHogar conecta
            estudiantes con arrendadores, pero no participa en los acuerdos entre ustedes.
          </p>
          <Link
            to="/el-proyecto"
            className="tocable shrink-0 text-xs font-semibold text-piedra-700 hover:text-terracota-600"
          >
            Sobre el proyecto
          </Link>
          <Link
            to="/privacidad"
            className="tocable shrink-0 text-xs font-semibold text-piedra-700 hover:text-terracota-600"
          >
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
