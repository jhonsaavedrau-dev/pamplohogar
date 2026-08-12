import { describe, expect, it } from 'vitest';
import { armarEnlaceWhatsapp } from './contacto.js';

describe('armarEnlaceWhatsapp', () => {
  it('agrega el indicativo de Colombia cuando falta', () => {
    const enlace = armarEnlaceWhatsapp('3145678901', 'Hola');
    expect(enlace).toContain('https://wa.me/573145678901');
  });

  it('no duplica el indicativo si ya viene', () => {
    const enlace = armarEnlaceWhatsapp('573145678901', 'Hola');
    expect(enlace).toContain('https://wa.me/573145678901');
    expect(enlace).not.toContain('5757');
  });

  it('limpia espacios, guiones y parentesis del número', () => {
    const enlace = armarEnlaceWhatsapp('(314) 567-89 01', 'Hola');
    expect(enlace).toContain('https://wa.me/573145678901');
  });

  it('codifica el mensaje para que no rompa la dirección', () => {
    const enlace = armarEnlaceWhatsapp('3145678901', 'Hola, sigue disponible? Gracias & saludos');
    expect(enlace).toContain('Hola%2C%20sigue%20disponible%3F');
    expect(enlace).toContain('%26');
    expect(enlace).not.toMatch(/\stext=/);
  });

  it('deja el mensaje después del parametro text', () => {
    const enlace = armarEnlaceWhatsapp('3145678901', 'Prueba');
    expect(enlace).toBe('https://wa.me/573145678901?text=Prueba');
  });
});
