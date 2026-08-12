import { describe, expect, it } from 'vitest';
import { esquemaLogin, esquemaRegistro } from './auth.js';
import { esquemaBusqueda, esquemaCrearInmueble } from './inmueble.js';
import { esquemaCrearResena } from './resena.js';

const registroValido = {
  nombre: 'Andrés Felipe Rojas',
  email: 'Andres.Rojas@Ejemplo.com',
  password: 'clave12345',
  rol: 'ESTUDIANTE' as const,
};

describe('esquemaRegistro', () => {
  it('acepta un registro correcto y normaliza el correo a minusculas', () => {
    const r = esquemaRegistro.parse(registroValido);
    expect(r.email).toBe('andres.rojas@ejemplo.com');
  });

  it('rechaza contraseñas de menos de ocho caracteres', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, password: 'corta' });
    expect(r.success).toBe(false);
  });

  it('rechaza correos mal escritos', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, email: 'esto-no-es-correo' });
    expect(r.success).toBe(false);
  });

  it('rechaza nombres demasiado cortos', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, nombre: 'Ab' });
    expect(r.success).toBe(false);
  });

  it('no deja registrarse directamente como administrador', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, rol: 'ADMIN' });
    expect(r.success).toBe(false);
  });

  it('acepta un celular colombiano valido', () => {
    const r = esquemaRegistro.parse({ ...registroValido, telefono: '3145678901' });
    expect(r.telefono).toBe('3145678901');
  });

  it('rechaza celulares que no empiezan por tres', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, telefono: '6015678901' });
    expect(r.success).toBe(false);
  });

  it('rechaza celulares con menos de diez digitos', () => {
    const r = esquemaRegistro.safeParse({ ...registroValido, telefono: '31456789' });
    expect(r.success).toBe(false);
  });
});

describe('esquemaLogin', () => {
  it('exige correo y contraseña', () => {
    expect(esquemaLogin.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(esquemaLogin.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});

const inmuebleValido = {
  titulo: 'Habitación amoblada cerca de la universidad',
  descripcion: 'Descripción suficientemente larga para pasar la validacion del servidor.',
  tipo: 'HABITACION' as const,
  precio: 400000,
  barrio: 'Centro',
  direccion: 'Calle 5 # 6-32',
  lat: 7.3768,
  lng: -72.6474,
  habitaciones: 1,
  banos: 1,
  servicios: ['wifi'],
  amoblado: true,
  fotos: [],
};

describe('esquemaCrearInmueble', () => {
  it('acepta un inmueble bien diligenciado', () => {
    expect(esquemaCrearInmueble.safeParse(inmuebleValido).success).toBe(true);
  });

  it('rechaza precios ridiculamente bajos', () => {
    expect(esquemaCrearInmueble.safeParse({ ...inmuebleValido, precio: 100 }).success).toBe(false);
  });

  it('rechaza precios fuera de rango por arriba', () => {
    expect(
      esquemaCrearInmueble.safeParse({ ...inmuebleValido, precio: 99000000 }).success,
    ).toBe(false);
  });

  it('rechaza precios con decimales', () => {
    expect(esquemaCrearInmueble.safeParse({ ...inmuebleValido, precio: 400000.5 }).success).toBe(
      false,
    );
  });

  it('rechaza descripciones muy cortas', () => {
    expect(esquemaCrearInmueble.safeParse({ ...inmuebleValido, descripcion: 'Corta' }).success).toBe(
      false,
    );
  });

  it('rechaza servicios que no están en el catalogo', () => {
    expect(
      esquemaCrearInmueble.safeParse({ ...inmuebleValido, servicios: ['piscina-olimpica'] }).success,
    ).toBe(false);
  });

  it('rechaza coordenadas imposibles', () => {
    expect(esquemaCrearInmueble.safeParse({ ...inmuebleValido, lat: 200 }).success).toBe(false);
  });

  it('rechaza mas de diez fotos', () => {
    const once = Array.from({ length: 11 }, (_, i) => ({
      url: `https://ejemplo.com/foto${i}.jpg`,
      publicId: `id${i}`,
    }));
    expect(esquemaCrearInmueble.safeParse({ ...inmuebleValido, fotos: once }).success).toBe(false);
  });
});

describe('esquemaBusqueda', () => {
  it('convierte los filtros de texto a números', () => {
    const f = esquemaBusqueda.parse({ precioMin: '200000', precioMax: '800000' });
    expect(f.precioMin).toBe(200000);
    expect(f.precioMax).toBe(800000);
  });

  it('deja los filtros vacios como indefinidos', () => {
    const f = esquemaBusqueda.parse({ precioMin: '', precioMax: undefined });
    expect(f.precioMin).toBeUndefined();
    expect(f.precioMax).toBeUndefined();
  });

  it('separa la lista de servicios por comas', () => {
    const f = esquemaBusqueda.parse({ servicios: 'wifi,agua,luz' });
    expect(f.servicios).toEqual(['wifi', 'agua', 'luz']);
  });

  it('usa el orden por recientes cuando no se pide nada', () => {
    expect(esquemaBusqueda.parse({}).orden).toBe('recientes');
  });

  it('rechaza un orden que no existe', () => {
    expect(esquemaBusqueda.safeParse({ orden: 'aleatorio' }).success).toBe(false);
  });

  it('convierte amoblado a booleano', () => {
    expect(esquemaBusqueda.parse({ amoblado: 'true' }).amoblado).toBe(true);
    expect(esquemaBusqueda.parse({ amoblado: 'false' }).amoblado).toBe(false);
  });

  it('cae en la página uno si le mandan basura', () => {
    expect(esquemaBusqueda.parse({ pagina: 'abc' }).pagina).toBe(1);
    expect(esquemaBusqueda.parse({ pagina: '-5' }).pagina).toBe(1);
    expect(esquemaBusqueda.parse({ pagina: '3' }).pagina).toBe(3);
  });
});

describe('esquemaCrearResena', () => {
  const base = {
    inmuebleId: 'abc123',
    calificacion: 5,
    comentario: 'Muy buena experiencia con este arrendador.',
  };

  it('acepta una reseña completa', () => {
    expect(esquemaCrearResena.safeParse(base).success).toBe(true);
  });

  it('solo acepta calificaciones entre uno y cinco', () => {
    expect(esquemaCrearResena.safeParse({ ...base, calificacion: 0 }).success).toBe(false);
    expect(esquemaCrearResena.safeParse({ ...base, calificacion: 6 }).success).toBe(false);
    expect(esquemaCrearResena.safeParse({ ...base, calificacion: 3 }).success).toBe(true);
  });

  it('rechaza comentarios de una sola palabra', () => {
    expect(esquemaCrearResena.safeParse({ ...base, comentario: 'Malo' }).success).toBe(false);
  });
});
