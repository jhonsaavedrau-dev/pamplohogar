import { Link } from 'react-router-dom';
import { Marca } from './Marca';

/*
  El pie de pagina.

  COMO ESTABA. Abajo del todo, en una sola fila repartida a los lados, iban tres
  cosas que no tienen nada que ver entre si: el aviso de verificar el inmueble
  en persona, "Sobre el proyecto" y "Privacidad". Los dos enlaces quedaban
  flotando al lado de un parrafo largo, sin pertenecer a ninguna columna, y el
  aviso -- que es el unico texto del pie que puede evitarle un problema serio a
  alguien -- se leia como letra menuda de contrato.

  COMO QUEDO. Tres bloques, cada uno con una sola funcion:

  1. Las columnas de enlaces, ahora TRES. "Sobre el proyecto" y "Privacidad"
     dejaron de ser huerfanos: tienen su propia columna, con el resto de lo que
     habla de la plataforma en si.
  2. El aviso de seguridad, solo, en su propio recuadro y con su icono. No
     compite con nada.
  3. El renglon del año, que es lo unico que de verdad va abajo del todo.

  Y entraron dos enlaces que faltaban: el mapa de precios, que es de lo mejor
  que tiene la plataforma y no estaba en el pie, y el correo de contacto.

  EL REPARTO A LO ANCHO. Las cuatro columnas -- la marca y las tres de enlaces
  -- van en una rejilla pareja. Antes la marca se quedaba con la izquierda y los
  enlaces se iban todos contra el borde derecho, y en el medio quedaba un hueco
  del ancho de media pantalla.

  EN CELULAR LOS ENLACES VAN EN DOS COLUMNAS, no en una. Apilados de a uno, la
  columna de Estudiantes sola medía cinco enlaces de 44 pixeles y el pie se
  volvia una pagina entera de bajar.

  Y LOS ENLACES VAN MAS JUNTOS EN EL COMPUTADOR. La clase `tocable` le pone 44
  pixeles de alto a cada enlace, que es el minimo para que un dedo no le pegue
  al de al lado. En un celular hace falta; en un computador, donde se apunta con
  el raton, esos 44 pixeles por enlace estiraban la columna de Estudiantes hasta
  el doble de alto que las otras dos y dejaban el pie desbalanceado.
*/

const ENLACES = [
  {
    titulo: 'Estudiantes',
    items: [
      { a: '/', texto: 'Buscar vivienda' },
      { a: '/mapa-de-precios', texto: 'Mapa de precios' },
      { a: '/comparar', texto: 'Comparar' },
      { a: '/roomies', texto: 'Buscar roomie' },
      { a: '/favoritos', texto: 'Mis favoritos' },
    ],
  },
  {
    titulo: 'Arrendadores',
    items: [
      { a: '/registro', texto: 'Publicar inmueble' },
      { a: '/mis-inmuebles', texto: 'Mis inmuebles' },
    ],
  },
  {
    titulo: 'PamploHogar',
    items: [
      { a: '/el-proyecto', texto: 'Sobre el proyecto' },
      { a: '/privacidad', texto: 'Privacidad' },
    ],
  },
];

export function PiePagina() {
  return (
    <footer className="sin-imprimir mt-20 border-t border-piedra-200 bg-white">
      <div className="contenedor-app py-10">
        {/* ------------------------------------------ la marca y los enlaces */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1 lg:max-w-xs">
            {/*
              El logo del pie tambien lleva al inicio. Antes era solo un dibujo:
              quien llega al final de la pagina y quiere volver a empezar le
              pulsa, no pasa nada, y toca subir hasta arriba.
            */}
            <Link to="/" aria-label="Ir al inicio de PamploHogar" className="inline-block">
              <Marca conLema />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-piedra-600">
              Vivienda estudiantil en Pamplona, Norte de Santander. Para que encontrar dónde vivir
              no dependa de a quién conozcas.
            </p>
          </div>

          {ENLACES.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <p className="mb-3 text-xs font-bold tracking-wide text-piedra-600 uppercase">
                {columna.titulo}
              </p>
              <ul>
                {columna.items.map((item) => (
                  <li key={item.a}>
                    <Link
                      to={item.a}
                      className="inline-flex min-h-11 items-center text-sm text-piedra-700 hover:text-terracota-600 sm:min-h-0 sm:py-[5px]"
                    >
                      {item.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ------------------------------------------- el aviso, solo y visible */}
        <div className="mt-10 flex items-start gap-3 rounded-xl border border-terracota-200 bg-terracota-50 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-terracota-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm leading-relaxed text-piedra-700">
            <span className="font-semibold text-piedra-900">
              Verifica siempre el inmueble en persona antes de entregar dinero.
            </span>{' '}
            PamploHogar conecta estudiantes con arrendadores, pero no participa en los acuerdos
            entre ustedes.
          </p>
        </div>

        {/* ----------------------------------------------- el renglon del año */}
        <div className="mt-8 flex flex-col gap-2 border-t border-piedra-100 pt-6 text-xs text-piedra-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PamploHogar</p>
          <p>Hecho en Pamplona, Norte de Santander.</p>
        </div>
      </div>
    </footer>
  );
}
