/**
 * Crea la encuesta de arrendadores de PamploHogar en Google Forms.
 *
 * Se pega en script.google.com y se ejecuta una vez.
 *
 * Ojo: esta encuesta rinde mas hecha en persona o por telefono, con el
 * formulario abierto y anotando uno mismo. Los arrendadores responden pocas
 * encuestas por internet. El formulario sirve igual para no perder ninguna
 * respuesta y para que quede todo en la misma hoja.
 */
function crearEncuestaArrendadores() {
  var formulario = FormApp.create('Cómo se arrienda a estudiantes en Pamplona');

  formulario.setDescription(
    'Estoy haciendo un estudio sobre cómo se arrienda a estudiantes en ' +
      'Pamplona. Son 4 minutos. No le voy a vender nada.',
  );

  formulario.setConfirmationMessage('Gracias por el tiempo.');
  formulario.setCollectEmail(false);
  formulario.setProgressBar(true);

  // ------------------------------------------------------------ que arrienda
  formulario.addPageBreakItem().setTitle('Lo que arrienda');

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuántos lugares arrienda en total?')
    .setChoiceValues(['Uno', 'Entre dos y cinco', 'Más de cinco'])
    .setRequired(true);

  formulario
    .addCheckboxItem()
    .setTitle('¿Qué tipo?')
    .setHelpText('Puede marcar varios.')
    .setChoiceValues([
      'Habitaciones dentro de una casa donde también vive gente',
      'Habitaciones en una casa solo para estudiantes',
      'Apartaestudios',
      'Apartamentos completos',
      'Casas completas',
    ])
    .setRequired(true);

  formulario.addTextItem().setTitle('¿En qué barrio o barrios?');

  // ------------------------------------------------- como consigue inquilinos
  formulario.addPageBreakItem().setTitle('Cómo consigue inquilinos');

  formulario
    .addCheckboxItem()
    .setTitle('¿Cómo consigue a sus inquilinos?')
    .setHelpText('Puede marcar varios.')
    .setChoiceValues([
      'Voz a voz, la gente llega recomendada',
      'Aviso pegado en la puerta o en la calle',
      'Grupos de WhatsApp',
      'Facebook',
      'Una inmobiliaria',
      'Ya tengo fijos que se quedan varios semestres',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuánto se demora normalmente en llenar un lugar cuando queda libre?')
    .setChoiceValues([
      'Menos de una semana',
      'Entre una y tres semanas',
      'Un mes o más',
      'Depende mucho de la época',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuántos meses al año le quedan lugares vacíos?')
    .setChoiceValues([
      'Ninguno, siempre lleno',
      'Uno o dos meses',
      'Entre tres y cinco',
      'Más de la mitad del año',
    ])
    .setRequired(true);

  formulario.addTextItem().setTitle('¿En qué época le cuesta más llenar?');

  // ------------------------------------------------------------- que molesta
  formulario.addPageBreakItem().setTitle('Lo incómodo');

  formulario
    .addCheckboxItem()
    .setTitle('¿Qué es lo más incómodo de arrendarle a estudiantes?')
    .setHelpText('Puede marcar varios.')
    .setChoiceValues([
      'Que me escriban y después no aparezcan',
      'Repetir la misma información a cada persona',
      'Que pregunten solo por el precio y ya',
      'Que se vayan antes de tiempo',
      'Los daños o el ruido',
      'Nada en particular',
    ]);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Le ha pasado que alguien le escriba y nunca vaya a ver el lugar?')
    .setChoiceValues(['Todo el tiempo', 'A veces', 'Casi nunca']);

  // ------------------------------------------------------------ la plataforma
  formulario.addPageBreakItem().setTitle('Sobre publicar en internet');

  formulario
    .addMultipleChoiceItem()
    .setTitle(
      'Si existiera una página donde publicar gratis su inmueble y que la vieran ' +
        'los estudiantes de la Universidad de Pamplona, ¿publicaría?',
    )
    .setChoiceValues([
      'Sí, de una',
      'Sí, pero necesitaría que alguien me ayude a subirlo',
      'Lo pensaría',
      'No',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle(
      '¿Le molestaría que los estudiantes puedan dejar opiniones públicas sobre ' +
        'cómo fue vivir ahí?',
    )
    .setChoiceValues(['No, me parece bien', 'Depende de cómo funcione', 'Sí, no me gusta la idea'])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle(
      '¿Pagaría algo para que su publicación aparezca destacada cuando tiene afán de llenar?',
    )
    .setChoiceValues(['Sí', 'Depende de cuánto', 'No'])
    .setRequired(true);

  formulario
    .addTextItem()
    .setTitle('Si respondió que sí o que depende: ¿cuánto le parecería razonable al mes?');

  formulario
    .addParagraphTextItem()
    .setTitle('¿Qué necesitaría ver para confiar en una página así?');

  formulario
    .addTextItem()
    .setTitle('¿Me deja un contacto para avisarle cuando esté lista?')
    .setHelpText('Opcional. Un teléfono o un correo.');

  Logger.log('Formulario creado.');
  Logger.log('Para compartir: ' + formulario.getPublishedUrl());
  Logger.log('Para editar: ' + formulario.getEditUrl());
}
