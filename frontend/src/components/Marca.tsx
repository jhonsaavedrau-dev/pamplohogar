/*
  La marca de PamploHogar.

  Es el logo que hizo Jhon, no un dibujo aparte: la casa con el pin encima, y el
  nombre con su tipografia. Antes esto era un SVG escrito a mano que se le
  parecia, y no tenia sentido tener dos marcas distintas para la misma
  plataforma.

  Van dos archivos y no uno:

  - marca-completa.png, la casa con el nombre al lado. Es lo que se ve en el
    encabezado y en el pie.
  - marca-icono.png, solo la casa, cuadrada y con el fondo transparente. Sirve
    donde no cabe el nombre o donde el nombre estorba: la pestana del
    navegador, la pantalla de "no encontrado", la hoja para imprimir.

  De marca-icono.png salen tambien los iconos del celular y los de la app de
  Android, con `node android/generar-recursos.mjs`.
*/

/** Solo la casa. Se le pueden aplicar clases de tamano, opacidad o grises. */
export function IconoMarca({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src="/marca-icono.png"
      alt=""
      className={`${className} object-contain`}
      // Se dibuja antes de que llegue el resto de la pagina: en el encabezado
      // aparece de una y no deja el hueco saltando.
      loading="eager"
      decoding="async"
      aria-hidden="true"
    />
  );
}

interface PropsMarca {
  compacta?: boolean;
  /** El lema solo cabe en el pie de pagina y en pantallas grandes. */
  conLema?: boolean;
}

export function Marca({ compacta = false, conLema = false }: PropsMarca) {
  if (compacta) {
    return <IconoMarca className="h-10 w-10 shrink-0" />;
  }

  return (
    <span className="inline-flex flex-col">
      {/*
        El alto manda y el ancho se acomoda solo. El logo es cinco veces mas
        ancho que alto, asi que fijar el ancho lo dejaria diminuto en el
        celular.
      */}
      <img
        src="/marca-completa.png"
        alt="PamploHogar"
        className="h-9 w-auto object-contain sm:h-10"
        loading="eager"
        decoding="async"
      />
      {conLema && (
        <span className="mt-2 text-[0.6rem] font-semibold tracking-[0.18em] text-piedra-600 uppercase">
          Tu lugar en Pamplona
        </span>
      )}
    </span>
  );
}
