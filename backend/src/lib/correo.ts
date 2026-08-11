import { env } from './env.js';

export const correoConfigurado = env.RESEND_API_KEY !== '';

interface Mensaje {
  para: string;
  asunto: string;
  titulo: string;
  parrafos: string[];
  textoBoton: string;
  enlace: string;
  pie: string;
}

/** Plantilla unica, para que todos los correos se vean igual y en espanol. */
function armarHtml(m: Mensaje): string {
  const parrafos = m.parrafos
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3a352e">${p}</p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es-CO"><body style="margin:0;padding:24px;background:#faf9f7;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e0d9;border-radius:16px">
    <tr><td style="padding:32px">
      <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#241f1a">
        Pamplo<span style="color:#d2691e">Hogar</span>
      </p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#241f1a">${m.titulo}</h1>
      ${parrafos}
      <p style="margin:24px 0">
        <a href="${m.enlace}" style="display:inline-block;background:#d2691e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:16px">${m.textoBoton}</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b655b">
        Si el boton no funciona, copia y pega esta direccion en tu navegador:
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#1f6fb2;word-break:break-all">${m.enlace}</p>
      <hr style="border:none;border-top:1px solid #e4e0d9;margin:24px 0" />
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b655b">${m.pie}</p>
    </td></tr>
  </table>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#a8a196;text-align:center">
    PamploHogar, vivienda estudiantil en Pamplona, Norte de Santander
  </p>
</body></html>`;
}

function armarTexto(m: Mensaje): string {
  return [m.titulo, '', ...m.parrafos.map((p) => p.replace(/<[^>]+>/g, '')), '', m.enlace, '', m.pie]
    .join('\n')
    .trim();
}

/**
 * Envia el correo. Si el servicio no esta configurado devuelve false en lugar
 * de reventar: quien llama decide que decirle al usuario.
 */
export async function enviarCorreo(m: Mensaje): Promise<boolean> {
  if (!correoConfigurado) {
    process.stderr.write(
      '[PamploHogar] Se intento enviar un correo pero falta RESEND_API_KEY en la configuracion.\n',
    );
    return false;
  }

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CORREO_REMITENTE,
        to: [m.para],
        subject: m.asunto,
        html: armarHtml(m),
        text: armarTexto(m),
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      process.stderr.write(
        `[PamploHogar] El servicio de correo respondio ${respuesta.status}: ${detalle.slice(0, 300)}\n`,
      );
      return false;
    }

    return true;
  } catch (error) {
    process.stderr.write(
      `[PamploHogar] No se pudo contactar al servicio de correo: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return false;
  }
}

export function correoDeRecuperacion(para: string, nombre: string, enlace: string): Mensaje {
  return {
    para,
    asunto: 'Recupera tu contrasena de PamploHogar',
    titulo: `Hola ${nombre}, vamos a recuperar tu cuenta`,
    parrafos: [
      'Pediste cambiar la contrasena de tu cuenta. Pulsa el boton y elige una nueva.',
      'Este enlace sirve una sola vez y vence en una hora.',
    ],
    textoBoton: 'Cambiar mi contrasena',
    enlace,
    pie: 'Si no fuiste tu, ignora este correo: tu contrasena sigue igual y nadie entro a tu cuenta.',
  };
}

export function correoDeVerificacion(para: string, nombre: string, enlace: string): Mensaje {
  return {
    para,
    asunto: 'Confirma tu correo en PamploHogar',
    titulo: `Bienvenido a PamploHogar, ${nombre}`,
    parrafos: [
      'Solo falta confirmar que este correo es tuyo. Pulsa el boton y listo.',
      'Confirmarlo le da confianza a los estudiantes y arrendadores con los que hables.',
    ],
    textoBoton: 'Confirmar mi correo',
    enlace,
    pie: 'Si no creaste esta cuenta, ignora este correo y no pasara nada.',
  };
}
