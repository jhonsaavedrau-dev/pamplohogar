import { COLOR } from './marca';

/*
  El resaltado en naranja.

  Antes se resaltaba media frase, y media frase resaltada no resalta nada: el
  ojo no sabe donde parar. Ahora se marca UNA palabra, la que carga el sentido,
  encerrandola entre asteriscos:

    'Buscar arriendo en Pamplona es *preguntar*.'

  De ahi salen los trozos, alternando normal y marcado. Escribirlo asi tiene
  una ventaja practica: el texto se sigue leyendo como texto al editarlo, sin
  etiquetas de por medio.
*/

export interface Trozo {
  palabra: string;
  fuerte: boolean;
}

/** Parte un texto marcado en sus trozos, sin partir las palabras. */
export function trozos(texto: string): Trozo[] {
  return texto
    .split('*')
    .flatMap((parte, i) =>
      parte
        .split(' ')
        .filter(Boolean)
        .map((palabra) => ({ palabra, fuerte: i % 2 === 1 })),
    );
}

/** El color que le toca a un trozo. */
export function color(fuerte: boolean) {
  return fuerte ? COLOR.terracota : COLOR.piedra;
}
