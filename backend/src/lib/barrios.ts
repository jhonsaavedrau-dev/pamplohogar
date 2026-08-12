/**
 * Marcas de acento que quedan sueltas al descomponer el texto con NFD.
 * Van escritas con su codigo y no con el caracter directo porque son
 * invisibles en el editor: cualquiera las borraria sin darse cuenta.
 */
const ACENTOS = /[\u0300-\u036f]/g;

/**
 * El barrio se escribe a mano al publicar, asi que "El Buque", "el buque" y
 * "EL BUQUE " son el mismo lugar escrito de tres formas. Sin una clave comun,
 * las opiniones de un mismo barrio quedarian repartidas en varios montones y
 * ninguno tendria suficientes para servir de algo.
 */
export function claveDeBarrio(barrio: string): string {
  return barrio
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
