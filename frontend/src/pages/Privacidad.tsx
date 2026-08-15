import { Link } from 'react-router-dom';

/*
  La politica de privacidad.

  Es una pagina de la aplicacion y no un archivo suelto porque tiene que vivir
  en una direccion fija y publica: Google Play la exige para aprobar la app, y
  la revisan de verdad. Ademas asi se ve como el resto de la plataforma.

  Esta escrita para que la entienda un estudiante de primer semestre, no para
  que aguante un pleito. Cada punto dice que dato se guarda y por que, y sobre
  todo que NO se hace, que es lo que la gente quiere saber.
*/

const ACTUALIZADA = '15 de agosto de 2026';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-piedra-900">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-piedra-700">{children}</div>
    </section>
  );
}

export function Privacidad() {
  return (
    <div className="contenedor-app max-w-2xl py-12">
      <h1 className="titular">Privacidad</h1>
      <p className="mt-3 text-piedra-600">
        Qué datos guarda PamploHogar, para qué, y qué no hacemos con ellos. Última actualización:{' '}
        {ACTUALIZADA}.
      </p>

      <Seccion titulo="Quién maneja esto">
        <p>
          PamploHogar es una plataforma para conectar estudiantes de la Universidad de Pamplona con
          arrendadores de la ciudad. La lleva una persona, no una empresa, y el correo de contacto es{' '}
          <a className="text-terracota-700 underline" href="mailto:avisos@pamplohogar.com">
            avisos@pamplohogar.com
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="Qué datos guardamos">
        <p>Solo lo que hace falta para que la plataforma sirva:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>Tu nombre y tu correo</strong>, para tener cuenta y para escribirte cuando pasa
            algo con ella.
          </li>
          <li>
            <strong>Tu contraseña</strong>, guardada cifrada. Nadie, ni quien administra la
            plataforma, puede leerla.
          </li>
          <li>
            <strong>Tu celular</strong>, solo si eres arrendador y decides ponerlo. Se le muestra al
            estudiante únicamente cuando él pulsa «Contactar».
          </li>
          <li>
            <strong>Tu foto y tu descripción</strong>, si decides ponerlas. Las dos son opcionales.
          </li>
          <li>
            <strong>Lo que publicas</strong>: inmuebles, fotos, reseñas, opiniones de barrio y
            perfil de roomie.
          </li>
          <li>
            <strong>Tus mensajes</strong> con otros usuarios dentro de la plataforma.
          </li>
          <li>
            <strong>Tus favoritos y búsquedas guardadas</strong>, para poder mostrártelos después y
            avisarte cuando aparece algo que encaja.
          </li>
        </ul>
        <p>
          No pedimos documento de identidad, ni datos bancarios, ni ubicación del teléfono. La
          plataforma no cobra ni procesa pagos: los acuerdos de plata son directamente entre
          estudiante y arrendador, por fuera de aquí.
        </p>
      </Seccion>

      <Seccion titulo="Qué ve cada quien">
        <p>
          Tu nombre, tu foto y tu descripción los ve cualquiera que entre a la plataforma. Tu correo
          no se le muestra nunca a otro usuario. El celular del arrendador está oculto hasta que un
          estudiante pide el contacto, y esa solicitud queda registrada para que el arrendador sepa
          quién le escribió.
        </p>
        <p>
          Cuando reportas una publicación, el arrendador nunca sabe quién lo reportó. Las reseñas sí
          van firmadas con tu nombre, porque una calificación anónima no le sirve a nadie para
          decidir.
        </p>
        <p>
          Quien administra la plataforma puede leer los mensajes cuando hay que atender un problema.
          Cada lectura queda anotada en un registro y a las dos personas del chat se les avisa en la
          propia pantalla. Preferimos decirlo así de claro a que alguien se entere después.
        </p>
      </Seccion>

      <Seccion titulo="Con quién compartimos">
        <p>
          Con nadie que quiera venderte algo. No vendemos ni alquilamos datos, y no hay publicidad ni
          rastreadores de terceros en la plataforma.
        </p>
        <p>Solo se apoya en estos servicios, y cada uno recibe únicamente lo que necesita:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>Neon</strong>, donde vive la base de datos.
          </li>
          <li>
            <strong>Render</strong> y <strong>Vercel</strong>, donde corren el servidor y la página.
          </li>
          <li>
            <strong>Cloudinary</strong>, donde se guardan las fotos.
          </li>
          <li>
            <strong>Resend</strong>, que entrega los correos.
          </li>
          <li>
            <strong>Google</strong>, solo si eliges entrar con tu cuenta de Google. En ese caso
            Google nos dice tu nombre y tu correo, nada más.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Cuánto tiempo">
        <p>
          Mientras tengas cuenta. Si la eliminas, se borran también tus inmuebles, tus fotos, tus
          favoritos, tus búsquedas y tus mensajes. Las fotos se borran también de Cloudinary, no solo
          de la lista.
        </p>
        <p>
          Queda una excepción honesta: el registro de acciones del administrador guarda qué se hizo y
          cuándo, incluido el correo de la cuenta afectada, aunque la cuenta ya no exista. Si se
          borrara, nadie podría comprobar después por qué se retiró una publicación.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Puedes ver y corregir tus datos desde <Link className="text-terracota-700 underline" to="/mi-cuenta">Mi cuenta</Link>,
          y puedes pedir que se borre todo escribiendo a{' '}
          <a className="text-terracota-700 underline" href="mailto:avisos@pamplohogar.com">
            avisos@pamplohogar.com
          </a>{' '}
          desde el correo de tu cuenta. También puedes dejar de recibir los avisos de búsquedas
          guardadas sin borrar la búsqueda, desde esa misma pantalla.
        </p>
      </Seccion>

      <Seccion titulo="Menores de edad">
        <p>
          La plataforma está pensada para estudiantes universitarios. No está dirigida a menores de
          14 años y no recogemos datos de ellos a propósito.
        </p>
      </Seccion>

      <Seccion titulo="Si esto cambia">
        <p>
          Si algún día cambia lo que se guarda o con quién se comparte, se actualiza esta página y se
          cambia la fecha de arriba. Si el cambio es grande, se avisa dentro de la plataforma.
        </p>
      </Seccion>
    </div>
  );
}
