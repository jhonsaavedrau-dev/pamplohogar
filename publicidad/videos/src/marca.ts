/*
  Los colores y las medidas de PamploHogar, en un solo sitio.

  Son los mismos de la pagina (frontend/src/index.css). Si algun dia cambia la
  paleta alla, hay que cambiarla aqui: no se pueden compartir porque el video
  se construye aparte, sin Tailwind.
*/

export const COLOR = {
  crema: '#FFF7F0',
  terracota: '#B25317',
  terracotaClaro: '#D2691E',
  piedra: '#1F1B17',
  piedraGris: '#4A443B',
  piedraSuave: '#655E52',
  blanco: '#FFFFFF',

  /*
    La version de noche. El fondo no es negro sino la piedra de la marca muy
    oscurecida: un negro puro sobre un video vertical se ve como un hueco, y
    ademas rompe con el resto del material, que es todo tierra.
  */
  noche: '#17130F',
  nocheSuave: '#241E19',
  cremaTexto: '#FBF3EC',
};

/*
  Una historia de Instagram o un estado de WhatsApp: 1080 por 1920.

  30 cuadros por segundo y 15 segundos. Mas largo no lo ve nadie completo, y
  Instagram corta las historias a los 15 de todos modos.
*/
export const VIDEO = {
  ancho: 1080,
  alto: 1920,
  fps: 30,
  segundos: 15,
};

export const LETRA = "'Segoe UI', system-ui, -apple-system, sans-serif";

/*
  La letra con gracia del nombre.

  La pagina usa Fraunces, que no esta instalada en este computador y no se
  puede descargar dentro del video. Georgia es la que mas se le parece de las
  que hay siempre: con gracia, de trazo grueso y sin aire de documento.
*/
export const LETRA_SERIF = "Georgia, 'Times New Roman', serif";
