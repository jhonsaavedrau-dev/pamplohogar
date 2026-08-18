/**
 * Crea la encuesta de estudiantes de PamploHogar en Google Forms.
 *
 * Se pega en script.google.com y se ejecuta una vez. Deja el formulario armado
 * con sus 15 preguntas y devuelve el enlace en el registro de ejecucion.
 *
 * Si hay que cambiar una pregunta despues, se cambia en el formulario mismo:
 * volver a ejecutar esto crea OTRO formulario, no actualiza el anterior.
 */
function crearEncuestaEstudiantes() {
  var formulario = FormApp.create('Cómo consigue arriendo la gente en Pamplona');

  formulario.setDescription(
    'Estoy investigando cómo hacen los estudiantes para conseguir dónde vivir ' +
      'en Pamplona. Son 3 minutos y es anónimo. No vendo nada.',
  );

  formulario.setConfirmationMessage(
    'Gracias. De verdad ayuda: con esto se puede mostrar que el problema existe.',
  );

  // Sin correo obligatorio: el anonimato es lo que hace que respondan sincero.
  formulario.setCollectEmail(false);
  formulario.setProgressBar(true);

  // ---------------------------------------------------------------- quien eres
  formulario.addPageBreakItem().setTitle('Sobre ti');

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿De dónde eres?')
    .setChoiceValues([
      'De Pamplona',
      'De otro municipio de Norte de Santander',
      'De otro departamento',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿En qué semestre vas?')
    .setChoiceValues(['Primero o segundo', 'De tercero a sexto', 'De séptimo en adelante'])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Dónde vives ahora?')
    .setChoiceValues([
      'En una habitación arrendada',
      'En un apartaestudio o apartamento solo',
      'Compartiendo apartamento o casa con otros',
      'En casa de familiares',
      'En casa propia o de mis papás',
    ])
    .setRequired(true);

  // ------------------------------------------------------- la ultima busqueda
  formulario.addPageBreakItem().setTitle('La última vez que buscaste dónde vivir');

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cómo lo conseguiste?')
    .setChoiceValues([
      'Un familiar o conocido me lo consiguió',
      'Un grupo de WhatsApp',
      'Facebook o Marketplace',
      'Vi un aviso pegado en la calle o en la universidad',
      'Caminando y preguntando',
      'Una inmobiliaria',
    ])
    .showOtherOption(true)
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuánto te demoraste en encontrarlo, desde que empezaste a buscar?')
    .setChoiceValues([
      'Menos de un día',
      'Entre 2 y 3 días',
      'Una semana',
      'Dos semanas o más',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuántos lugares alcanzaste a ver en persona antes de decidir?')
    .setChoiceValues([
      'Ninguno, tomé el primero',
      'Uno o dos',
      'Entre tres y cinco',
      'Más de cinco',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuánto pagas de arriendo al mes? (solo el arriendo, sin servicios)')
    .setChoiceValues([
      'Menos de 250.000',
      'Entre 250.000 y 400.000',
      'Entre 400.000 y 600.000',
      'Entre 600.000 y 900.000',
      'Más de 900.000',
      'No pago arriendo',
    ])
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Los servicios van incluidos en ese precio?')
    .setChoiceValues([
      'Sí, todo incluido',
      'Algunos sí, otros no',
      'No, todo aparte',
      'No sé bien',
    ]);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Cuánto te demoras caminando hasta la universidad?')
    .setChoiceValues([
      'Menos de 10 minutos',
      'Entre 10 y 20',
      'Entre 20 y 30',
      'Más de 30, o me toca transporte',
    ]);

  // ------------------------------------------------------------ que salio mal
  formulario.addPageBreakItem().setTitle('Cómo te fue');

  formulario
    .addCheckboxItem()
    .setTitle('¿Te pasó alguna de estas cosas?')
    .setHelpText('Puedes marcar varias.')
    .setChoiceValues([
      'El lugar no era como en las fotos',
      'Me pidieron más plata de la que decía el aviso',
      'Aparecieron cobros que nadie me había mencionado',
      'El arrendador no cumplió algo que prometió',
      'Tuve que mudarme antes de lo que pensaba',
      'No, todo bien',
    ]);

  formulario
    .addParagraphTextItem()
    .setTitle('Cuando estabas buscando, ¿qué fue lo más difícil?')
    .setHelpText('En pocas palabras, como se te ocurra.');

  // --------------------------------------------------------- que haria falta
  formulario.addPageBreakItem().setTitle('Qué te habría servido');

  formulario
    .addCheckboxItem()
    .setTitle(
      'Si hubiera existido un solo sitio con todos los arriendos de Pamplona, ' +
        '¿qué te habría servido más ver?',
    )
    .setHelpText('Escoge máximo 2.')
    .setChoiceValues([
      'El precio antes de tener que escribir',
      'A cuántos minutos queda de la universidad',
      'Si el precio es normal o está caro para ese barrio',
      'Fotos de verdad y suficientes',
      'Opiniones de quienes vivieron ahí antes',
      'Si el arrendador responde o no',
    ])
    .setValidation(
      FormApp.createCheckboxValidation()
        .requireSelectAtMost(2)
        .setHelpText('Escoge máximo 2.')
        .build(),
    )
    .setRequired(true);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Alguna vez buscaste con quién compartir arriendo (roomie)?')
    .setChoiceValues(['Sí, y encontré', 'Sí, pero no encontré', 'No, nunca lo he necesitado']);

  formulario
    .addMultipleChoiceItem()
    .setTitle('¿Te gustaría que te avisaran cuando salga algo que encaje con lo que buscas?')
    .setChoiceValues(['Sí, por WhatsApp', 'Sí, por correo', 'No me interesa']);

  formulario
    .addTextItem()
    .setTitle('Si quieres que te avisemos cuando esté lista, déjanos tu correo o WhatsApp')
    .setHelpText('Opcional. No se usa para nada más.');

  Logger.log('Formulario creado.');
  Logger.log('Para compartir: ' + formulario.getPublishedUrl());
  Logger.log('Para editar: ' + formulario.getEditUrl());
}
