import { Link } from 'react-router-dom';

/*
  Quien esta detras de PamploHogar y por que existe.

  Google Play y cualquiera que vaya a donar preguntan lo mismo: quien es el
  responsable. Una plataforma sin cara pidiendo plata da desconfianza, con
  razon. Aqui se dice claro que la hizo una persona, sola, sin plata de nadie.

  LOS DATOS DE JHON VAN COMO CONSTANTES AQUI ARRIBA, no repartidos por el
  texto: cuando cambie un numero o un correo se cambia en un solo sitio y no
  hay que ir a buscarlo entre los parrafos.
*/

const AUTOR = {
  nombre: 'Jhon Saavedra',
  correo: 'jhonsaavedrau@gmail.com',
  // La foto va en frontend/public. Mientras no exista, se muestra la inicial.
  foto: '/jhon.jpg',
};

/*
  Las donaciones.

  El numero se deja vacio a proposito hasta que Jhon lo confirme: publicar un
  numero equivocado manda la plata de un estudiante a un desconocido. Con el
  vacio, el bloque no se dibuja y no pasa nada.
*/
const DONACIONES = {
  activo: false,
  medio: 'Nequi',
  numero: '',
};

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
        PamploHogar no es una empresa. Es una plataforma que hizo una sola persona, sin plata de
        nadie, porque buscar dónde vivir en Pamplona dependía de a quién conocieras.
      </p>

      <div className="bloques mt-10">
        <Bloque titulo="Por qué existe">
          <p>
            Cada semestre llegan estudiantes de toda la región a la Universidad de Pamplona. Los que
            tienen un primo, un paisano o un compañero de colegio en la ciudad consiguen habitación
            en dos días. Los que no, terminan pagando de más por lo primero que aparece, sin saber
            si ese precio es normal, a cuánto queda de la universidad o cómo es el barrio de noche.
          </p>
          <p>
            Esa información existía, pero repartida en cabezas y en grupos de WhatsApp. Aquí está
            junta y a la vista: el precio antes de escribir, la distancia real hasta la U, si el
            arriendo se sale de lo que se cobra en ese barrio, y lo que cuentan los que ya vivieron
            ahí.
          </p>
        </Bloque>

        <Bloque titulo="Quién la hace">
          <div className="flex items-start gap-4">
            <img
              src={AUTOR.foto}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="space-y-3">
              <p>
                <strong className="text-piedra-900">{AUTOR.nombre}</strong>. Una persona, no un
                equipo. Nadie financia esto: ni la universidad, ni una inmobiliaria, ni un fondo.
              </p>
              <p>
                Decirlo importa porque explica dos cosas. Que aquí ninguna publicación se muestra
                primero por haber pagado, sencillamente porque no hay a quién pagarle. Y que si algo
                tarda en arreglarse, es porque lo arregla una sola persona.
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
            </div>
          </div>
        </Bloque>

        <Bloque titulo="Qué cuesta mantenerla">
          <p>
            La plataforma es gratis para el estudiante y para el arrendador, y va a seguir así.
            Pero mantenerla sí cuesta: el dominio se paga cada año, y los servidores donde viven la
            página, la base de datos y las fotos tienen un plan gratuito que se queda corto en
            época de matrículas, justo cuando más gente entra.
          </p>
        </Bloque>

        {DONACIONES.activo && DONACIONES.numero !== '' && (
          <Bloque titulo="Si quieres ayudar">
            <p>
              Con lo que valen dos empanadas se paga un día de servidor. No hay recompensas ni
              beneficios: quien done ve exactamente lo mismo que quien no.
            </p>
            <div className="tarjeta mt-2 p-5">
              <p className="text-xs font-bold tracking-wide text-piedra-500 uppercase">
                {DONACIONES.medio}
              </p>
              <p className="precio mt-1 text-2xl font-extrabold text-piedra-900">
                {DONACIONES.numero}
              </p>
              <p className="mt-2 text-sm text-piedra-600">A nombre de {AUTOR.nombre}.</p>
            </div>
          </Bloque>
        )}

        <Bloque titulo="En qué se puede confiar">
          <ul className="ml-5 list-disc space-y-2">
            <li>Ninguna publicación aparece más arriba por haber pagado.</li>
            <li>No se venden datos, no hay publicidad y no hay rastreadores.</li>
            <li>
              El celular del arrendador solo se muestra cuando el estudiante lo pide, y queda
              constancia.
            </li>
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
