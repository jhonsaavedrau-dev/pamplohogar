import { Config } from '@remotion/cli/config';

/*
  Ajustes del renderizado.

  El punto de entrada va aqui y no en la linea de comandos, para que el comando
  sea corto y no haya que acordarse de la ruta.
*/
Config.setEntryPoint('./src/index.ts');

// Sin transparencia: el video va a WhatsApp e Instagram, que no la soportan, y
// con transparencia el archivo pesa mas sin ninguna ganancia.
Config.setVideoImageFormat('jpeg');

// Calidad alta, que el texto fino se ve sucio si se comprime de mas.
Config.setJpegQuality(95);
