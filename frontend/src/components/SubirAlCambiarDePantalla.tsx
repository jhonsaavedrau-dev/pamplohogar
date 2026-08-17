import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Sube al principio cuando se cambia de pantalla.
 *
 * La plataforma es una sola pagina que se rearma sola, asi que el navegador no
 * mueve el scroll al pasar de una pantalla a otra: se queda donde estaba. El
 * estudiante baja veinte inmuebles, pulsa uno, y la ficha se abre por la mitad
 * o directamente en el pie de pagina. Pasa igual al pulsar Roomies, Precios o
 * cualquier cosa del menu, y en el celular es peor porque el dedo ya venia
 * bajando.
 *
 * Con el boton de atras NO se sube: ahi la persona quiere volver exactamente
 * al inmueble que estaba mirando, no al principio de la lista. Por eso se
 * mira de que tipo es la navegacion; POP es atras o adelante del navegador.
 */
export function SubirAlCambiarDePantalla() {
  const { pathname } = useLocation();
  const tipo = useNavigationType();

  useEffect(() => {
    if (tipo === 'POP') return;
    // Sin animacion: al cambiar de pantalla, verla deslizarse marea y encima
    // tapa el primer instante de la pantalla nueva.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, tipo]);

  return null;
}
