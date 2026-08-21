/*
  Los barrios de Pamplona, Norte de Santander.

  DE DONDE SALEN. De dos fuentes oficiales, cruzadas entre si:

  - La cartografia basica digital de la cabecera municipal de Pamplona, escala
    1:1.000, ano 2025, publicada en la Infraestructura Colombiana de Datos
    Espaciales.
  - El listado de barrios del codigo postal urbano 543050.

  Ninguna de las dos trae la lista completa por si sola: la del codigo postal
  llega hasta la letra L y la cartografica no incluye algunos del centro. La de
  aqui es la union de las dos.

  POR QUE ES UNA SUGERENCIA Y NO UNA LISTA CERRADA. Un desplegable obligatorio
  se ve mas ordenado y es peor: el dia que alguien arriende en un sector que no
  esta aqui -- una urbanizacion nueva, un sector que la gente llama de otra
  forma -- no podria publicar. Asi que el campo sigue siendo de escribir y esto
  es lo que se le ofrece mientras escribe.

  Lo que si arregla: que "El Buque", "el buque" y "EL BUQUE" dejen de ser tres
  barrios distintos. Antes cada arrendador lo escribia a su manera y las
  opiniones de un mismo barrio quedaban repartidas en varios montones, ninguno
  con las tres que hacen falta para mostrar un promedio.
*/

export const BARRIOS_DE_PAMPLONA = [
  '4 de Julio',
  'Afanador',
  'Brighton',
  'Cariongo',
  'Centro',
  'Chapinero',
  'Chichira',
  'Cote Lamus',
  'Cristo Rey Parte Alta',
  'Cristo Rey Parte Baja',
  'El Arenal',
  'El Buque',
  'El Camellón',
  'El Carmen',
  'El Escorial',
  'El Guamo',
  'El Olivo',
  'El Progreso',
  'Galán',
  'Humilladero',
  'Juan XXIII',
  'Jurado',
  'La Esperanza',
  'La Feria',
  'Las Margaritas',
  'Libertador',
  'Nuevo Amanecer',
  'San Francisco',
  'San Luis Gonzaga',
  'San Rafael',
  'Santa Marta',
  'Santísima Trinidad',
  'Santo Domingo',
  'Simón Bolívar',
  'Tinto Redondo',
  'Unidos',
  'Ursúa',
  'Valle del Espíritu Santo',
] as const;

/*
  El Escorial y La Feria aparecen arriba aunque la cartografia oficial los
  clasifique como veredas: la gente de Pamplona los nombra como barrios cuando
  busca arriendo, y en la plataforma ya hay publicaciones en los dos. Una lista
  que le lleve la contraria a como habla la gente no la usa nadie.
*/
