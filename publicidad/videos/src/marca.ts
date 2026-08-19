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
