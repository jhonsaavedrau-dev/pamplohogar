import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/*
  Verificacion en dos pasos con una app de autenticacion (TOTP, RFC 6238).

  Va con app y no con codigo por correo a proposito: mientras no haya dominio
  propio, un correo solo llega a la cuenta del dueno de la plataforma, asi que
  un arrendador de verdad quedaria encerrado fuera de su cuenta. Con la app
  funciona hoy mismo y ademas no depende de que llegue nada.

  Esta escrito a mano y no con una libreria porque son treinta lineas de
  cuentas y una dependencia mas es una cosa mas que mantener y actualizar.
*/

/** Cada codigo vale treinta segundos, que es lo que usan todas las apps. */
const SEGUNDOS_POR_CODIGO = 30;

/**
 * Cuantos pasos de treinta segundos se aceptan hacia atras y hacia adelante.
 *
 * Uno para cada lado. Los relojes de los celulares se desfasan y sin margen
 * la gente escribiria el codigo correcto y la pagina le diria que no. Mas
 * margen que este ya alarga de mas la vida de un codigo robado.
 */
const MARGEN_DE_PASOS = 1;

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Las apps de autenticacion solo entienden la clave en base32. */
export function aBase32(bytes: Buffer): string {
  let bits = 0;
  let valor = 0;
  let salida = '';
  for (const b of bytes) {
    valor = (valor << 8) | b;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
  return salida;
}

export function desdeBase32(texto: string): Buffer {
  const limpio = texto.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const c of limpio) {
    const indice = ALFABETO_BASE32.indexOf(c);
    if (indice < 0) continue;
    valor = (valor << 5) | indice;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Una clave nueva, distinta para cada persona. */
export function claveNueva(): string {
  return aBase32(randomBytes(20));
}

/** El codigo de seis digitos que toca en un momento dado. */
export function codigoDe(clave: string, paso: number): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(paso));

  const resumen = createHmac('sha1', desdeBase32(clave)).update(contador).digest();
  const desplazamiento = resumen[resumen.length - 1] & 0x0f;
  const numero =
    ((resumen[desplazamiento] & 0x7f) << 24) |
    (resumen[desplazamiento + 1] << 16) |
    (resumen[desplazamiento + 2] << 8) |
    resumen[desplazamiento + 3];

  return String(numero % 1_000_000).padStart(6, '0');
}

export const pasoActual = (ahora: Date): number =>
  Math.floor(ahora.getTime() / 1000 / SEGUNDOS_POR_CODIGO);

/**
 * Se distingue "no es el codigo" de "ese ya lo usaste".
 *
 * Parece un detalle, pero no lo es: si a alguien que escribio el codigo
 * correcto se le dice que esta mal, se queda mirando la app sin entender,
 * revisando digito por digito uno que esta bien. Decirle que espere al
 * siguiente lo resuelve en cinco segundos.
 */
export type ResultadoCodigo =
  | { estado: 'bueno'; paso: number }
  | { estado: 'yaUsado' }
  | { estado: 'malo' };

/**
 * Revisa un codigo y dice en que paso encajo.
 *
 * Se devuelve el paso y no solo un si o un no para poder anotarlo: sin eso,
 * alguien que alcance a ver el codigo por encima del hombro lo podria volver
 * a usar durante el minuto siguiente.
 */
export function revisarCodigo(
  clave: string,
  codigo: string,
  ahora: Date,
  ultimoPasoUsado: number | null,
): ResultadoCodigo {
  const limpio = codigo.replace(/\D/g, '');
  if (limpio.length !== 6) return { estado: 'malo' };

  const actual = pasoActual(ahora);
  let acertoPeroViejo = false;

  for (let d = -MARGEN_DE_PASOS; d <= MARGEN_DE_PASOS; d++) {
    const paso = actual + d;
    if (!igualesSinFiltrar(codigoDe(clave, paso), limpio)) continue;
    if (ultimoPasoUsado !== null && paso <= ultimoPasoUsado) {
      acertoPeroViejo = true;
      continue;
    }
    return { estado: 'bueno', paso };
  }

  return acertoPeroViejo ? { estado: 'yaUsado' } : { estado: 'malo' };
}

/** Comparacion que tarda lo mismo acierte o no, para no soplar el codigo. */
function igualesSinFiltrar(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * La direccion que entiende la app de autenticacion.
 *
 * En el celular se puede tocar y la app queda configurada sola, sin escribir
 * nada. En el computador toca copiar la clave a mano.
 */
export function direccionParaLaApp(clave: string, correo: string): string {
  const cuenta = encodeURIComponent(`PamploHogar:${correo}`);
  const emisor = encodeURIComponent('PamploHogar');
  return `otpauth://totp/${cuenta}?secret=${clave}&issuer=${emisor}&algorithm=SHA1&digits=6&period=30`;
}

/** La clave partida en pedacitos, que es como se copia sin equivocarse. */
export const claveLegible = (clave: string): string =>
  clave.replace(/(.{4})/g, '$1 ').trim();

/**
 * Codigos de respaldo, por si pierde el celular.
 *
 * Sin esto, cambiar de telefono seria perder la cuenta para siempre, y eso
 * asusta mas de lo que protege: la gente no activaria la verificacion.
 */
export const CUANTOS_CODIGOS_DE_RESPALDO = 8;

export function codigosDeRespaldo(): string[] {
  return Array.from({ length: CUANTOS_CODIGOS_DE_RESPALDO }, () => {
    const parte = () => randomBytes(3).toString('hex').toUpperCase();
    return `${parte()}-${parte()}`;
  });
}
