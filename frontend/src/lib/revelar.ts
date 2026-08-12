import { useEffect } from 'react';

const MARGEN_SEGURIDAD_MS = 3000;

/**
 * Hace aparecer los elementos marcados con data-revelar cuando entran en pantalla.
 *
 * Tres decisiones deliberadas:
 *
 * 1. El contenido nace visible y solo se esconde despues de comprobar que el
 *    navegador soporta la animacion. Si algo falla, se ve todo; nunca al reves.
 * 2. El umbral es minimo (0.01): una tarjeta mas alta que la pantalla nunca
 *    llegaria a mostrar el 20 por ciento y se quedaria invisible para siempre.
 * 3. A los tres segundos se revela por las malas lo que siga escondido, por si
 *    el observador no disparo.
 */
export function useRevelarAlEntrar(dependencia: unknown): void {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elementos = Array.from(
      document.querySelectorAll<HTMLElement>('[data-revelar]:not([data-revelado])'),
    );
    if (elementos.length === 0) return;

    elementos.forEach((el) => el.classList.add('por-revelar'));

    const mostrar = (el: HTMLElement) => {
      el.classList.remove('por-revelar');
      el.dataset.revelado = 'si';
    };

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          mostrar(entrada.target as HTMLElement);
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px -4% 0px' },
    );

    elementos.forEach((el) => observador.observe(el));

    const red = window.setTimeout(() => elementos.forEach(mostrar), MARGEN_SEGURIDAD_MS);

    return () => {
      window.clearTimeout(red);
      observador.disconnect();
      // Si el componente se desmonta a medias, nada puede quedar escondido.
      elementos.forEach((el) => el.classList.remove('por-revelar'));
    };
  }, [dependencia]);
}
