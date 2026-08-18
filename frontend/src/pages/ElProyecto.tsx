import { Link } from 'react-router-dom';

/*
  Quien esta detras de PamploHogar y por que existe.

  Google Play y cualquiera que vaya a aportar preguntan lo mismo: quien
  responde por esto. Una plataforma sin cara pidiendo plata da desconfianza,
  con razon.

  LOS DATOS DE JHON VAN COMO CONSTANTES AQUI ARRIBA, no repartidos por el
  texto: cuando cambie un numero o un correo se cambia en un solo sitio y no
  hay que ir a buscarlo entre los parrafos.
*/

const AUTOR = {
  nombre: 'Jhon Saavedra',
  correo: 'jhonsaavedrau@gmail.com',
};

const NEQUI = '312 830 3205';

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="titulo-seccion">{titulo}</h2>
      <div className="space-y-3 leading-relaxed text-piedra-700">{children}</div>
    </section>
  );
}

export function ElProyecto() {
  return (
    <div className="contenedor-app max-w-2xl py-12">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-terracota-200/70 bg-white px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.08em] text-terracota-700 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-terracota-500" aria-hidden="true" />
        Hecho en Pamplona
      </p>

      <h1 className="titular">Vi un problema y lo resolví</h1>

      <p className="mt-4 text-lg leading-relaxed text-piedra-600">
        Buscar arriendo en Pamplona es difícil porque no hay nada organizado. Hay grupos de
        WhatsApp, publicaciones sueltas en Facebook y conocidos de conocidos. Eso es todo.
      </p>

      <div className="bloques mt-10">
        <Bloque titulo="Por qué existe">
          <p>
            Cada semestre llegan estudiantes de toda la región a la Universidad de Pamplona. El que
            tiene un primo, un paisano o un compañero de colegio en la ciudad consigue habitación en
            dos días. El que no, pregunta en un grupo donde el mismo aviso lleva tres meses dando
            vueltas, o termina tomando lo primero que aparece sin saber si ese precio es normal, a
            cuánto queda de la universidad o cómo es el barrio de noche.
          </p>
          <p>
            La información existía. Estaba repartida en cabezas, en chats y en carteles pegados en
            un poste. Aquí está junta, ordenada y a la vista: el precio antes de escribir, la
            distancia real hasta la U, si el arriendo se sale de lo que se cobra en ese barrio, y lo
            que cuentan los que ya vivieron ahí.
          </p>
        </Bloque>

        <Bloque titulo="Quién la hace">
          <p>
            <strong className="text-piedra-900">{AUTOR.nombre}</strong>. Una persona, no un equipo.
            La levanté yo, sin apoyo económico de nadie: ni de la universidad, ni de una
            inmobiliaria, ni de un fondo.
          </p>
          <p>
            Lo digo porque explica el ritmo. Si algo se daña o falta algo, lo arregla una sola
            persona, en los ratos que quedan.
          </p>
          <p>
            Si algo no funciona o se te ocurre algo mejor, escríbeme:{' '}
            <a
              className="font-semibold text-confianza-600 underline"
              href={`mailto:${AUTOR.correo}`}
            >
              {AUTOR.correo}
            </a>
          </p>
        </Bloque>

        <Bloque titulo="Gásteme un tinto">
          <p>
            Mantener esto prendido cuesta: el dominio se paga cada año y los servidores donde viven
            la página, la base de datos y las fotos se quedan cortos justo en época de matrículas,
            que es cuando más gente entra.
          </p>
          <p>
            Si la plataforma te sirvió para encontrar dónde vivir, o simplemente para no dar tantas
            vueltas, un tinto se agradece. Sin recompensas ni beneficios: quien aporta ve
            exactamente lo mismo que quien no.
          </p>

          <div className="tarjeta mt-2 flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-bold tracking-wide text-piedra-500 uppercase">Nequi</p>
              <p className="precio mt-1 text-2xl font-extrabold text-piedra-900">{NEQUI}</p>
              <p className="mt-1 text-sm text-piedra-600">A nombre de {AUTOR.nombre}</p>
            </div>
            <span className="text-4xl" aria-hidden="true">
              ☕
            </span>
          </div>
        </Bloque>

        <Bloque titulo="Cómo se sostiene">
          <p>
            Hoy no hay publicidad ni cobros. Más adelante puede haber patrocinios o publicaciones
            destacadas, y si llega a pasar se va a ver claramente marcado como tal, para que nadie
            confunda un aviso pagado con un resultado de la búsqueda.
          </p>
          <p>Lo que no va a pasar nunca: vender los datos de quien usa la plataforma.</p>
        </Bloque>

        <Bloque titulo="Lo que sí está garantizado">
          <ul className="ml-5 list-disc space-y-2">
            <li>No se venden datos y no hay rastreadores de terceros.</li>
            <li>
              El celular del arrendador solo se muestra cuando el estudiante lo pide, y queda
              constancia de quién lo pidió.
            </li>
            <li>Las reseñas no se borran por pedido del arrendador.</li>
            <li>
              Lo que se guarda y para qué está escrito en la{' '}
              <Link className="font-semibold text-confianza-600 underline" to="/privacidad">
                política de privacidad
              </Link>
              , en palabras que se entienden.
            </li>
          </ul>
        </Bloque>
      </div>
    </div>
  );
}
