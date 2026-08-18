import { Link } from 'react-router-dom';

/*
  Quien esta detras de PamploHogar y por que existe.

  Google Play y cualquiera que vaya a aportar preguntan lo mismo: quien
  responde por esto. Una plataforma sin cara pidiendo plata da desconfianza,
  con razon.

  El orden importa. Primero el problema, que es lo unico que le interesa a
  quien acaba de llegar; despues quien la hizo; y el tinto de ultimo, cuando ya
  leyo por que existe. Pedir antes de explicar espanta.

  LOS DATOS DE JHON VAN COMO CONSTANTES AQUI ARRIBA, no repartidos por el
  texto: cuando cambie un numero o un correo se cambia en un solo sitio.
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
      <div className="space-y-4 leading-relaxed text-piedra-700">{children}</div>
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
        En Pamplona conseguir dónde vivir no depende de buscar bien. Depende de a quién conozcas.
      </p>

      <div className="bloques mt-10">
        <Bloque titulo="El problema">
          <p>
            No existe un lugar donde estén los arriendos de la ciudad. Están repartidos en grupos de
            WhatsApp, en publicaciones sueltas de Facebook, en un cartel pegado en un poste y, sobre
            todo, en la cabeza de la gente. Así, el que llega con un primo o un paisano en la ciudad
            consigue habitación en dos días. El que llega sin conocer a nadie, no.
          </p>
          <p>
            Ese estudiante termina tomando lo primero que aparece. Sin saber si el precio es el
            normal por esa zona, cuánto va a caminar todos los días hasta la universidad, ni cómo se
            siente ese barrio a las nueve de la noche. Son tres cosas que uno solo descubre cuando ya
            firmó y pagó.
          </p>
        </Bloque>

        <Bloque titulo="Qué hace PamploHogar">
          <p>
            Poner toda esa información junta y antes de escribirle a nadie. El precio se ve de una,
            sin tener que preguntar. Al lado dice a cuántos minutos queda de la universidad, medido
            de verdad y no a ojo. Si el arriendo se sale de lo que se cobra por algo parecido en ese
            barrio, la plataforma lo dice y muestra con cuánto se está comparando.
          </p>
          <p>
            Y están las reseñas de quienes vivieron ahí antes: cómo trató el arrendador, si el barrio
            es tranquilo de noche, si pasa transporte. Eso antes se sabía solo preguntándole al
            indicado.
          </p>
        </Bloque>

        <Bloque titulo="Quién la hace">
          <p>
            <strong className="text-piedra-900">{AUTOR.nombre}</strong>, una persona. No hay equipo
            ni oficina, y nadie pone la plata: ni la universidad, ni una inmobiliaria, ni un fondo.
          </p>
          <p>
            Lo cuento porque explica el ritmo. Lo que se dañe lo arregla una sola persona, en los
            ratos que le quedan, y a veces eso toma unos días. Si algo no funciona o se te ocurre
            cómo mejorarlo, escríbeme y lo miro:{' '}
            <a
              className="font-semibold text-confianza-600 underline"
              href={`mailto:${AUTOR.correo}`}
            >
              {AUTOR.correo}
            </a>
          </p>
        </Bloque>

        <Bloque titulo="Cómo se sostiene">
          <p>
            Tenerla prendida cuesta plata: el dominio se paga cada año, y los servidores donde viven
            la página, la base de datos y las fotos se quedan cortos justo en época de matrículas,
            que es cuando más gente entra.
          </p>
          <p>
            Hoy no hay publicidad ni cobros de ningún tipo. Más adelante puede que haya patrocinios
            o publicaciones destacadas, y si llega ese día se va a ver marcado como tal: un aviso
            pagado nunca se va a hacer pasar por un resultado de la búsqueda.
          </p>
        </Bloque>

        <Bloque titulo="Lo que no cambia">
          <ul className="ml-5 list-disc space-y-2">
            <li>Los datos de quien usa la plataforma no se venden, ni ahora ni después.</li>
            <li>No hay rastreadores de terceros.</li>
            <li>
              El celular del arrendador solo aparece cuando el estudiante lo pide, y queda
              constancia de quién lo pidió.
            </li>
            <li>Una reseña no se borra porque al arrendador no le gustó.</li>
            <li>
              Qué se guarda y para qué está escrito sin rodeos en la{' '}
              <Link className="font-semibold text-confianza-600 underline" to="/privacidad">
                política de privacidad
              </Link>
              .
            </li>
          </ul>
        </Bloque>

        <Bloque titulo="¿Necesitas algo parecido?">
          <p>
            Estudio Análisis y Desarrollo de Software en el SENA y Licenciatura en Lenguas
            Extranjeras en la Universidad de Pamplona. Esta plataforma la hice de principio a
            fin: la página, el servidor, la base de datos, los mapas y la aplicación de celular.
          </p>
          <p>
            Si en tu negocio o tu proyecto necesitas una página, una tienda en línea, o
            automatizar algo que hoy haces a mano y te consume horas, escríbeme y lo hablamos sin
            compromiso:{' '}
            <a
              className="font-semibold text-confianza-600 underline"
              href={`mailto:${AUTOR.correo}`}
            >
              {AUTOR.correo}
            </a>
          </p>
        </Bloque>
        <Bloque titulo="Si te sirvió y quieres apoyar">
          <p>
            Nada de esto es obligatorio y la plataforma funciona igual para todos. Pero si te ayudó
            a encontrar dónde vivir, o al menos a dar menos vueltas, un tinto se agradece y ayuda a
            mantenerla prendida.
          </p>

          <div className="tarjeta flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-bold tracking-wide text-piedra-500 uppercase">
                Nequi · {AUTOR.nombre}
              </p>
              <p className="precio mt-1 text-2xl font-extrabold text-piedra-900">{NEQUI}</p>
            </div>
            <span className="text-4xl" aria-hidden="true">
              ☕
            </span>
          </div>

          <p className="text-sm text-piedra-600">
            Quien aporta no recibe nada distinto: ve exactamente la misma plataforma que los demás.
          </p>
        </Bloque>
      </div>
    </div>
  );
}
