import { PrismaClient, type TipoInmueble } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const foto = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;

interface SemillaInmueble {
  titulo: string;
  descripcion: string;
  tipo: TipoInmueble;
  precio: number;
  barrio: string;
  direccion: string;
  lat: number;
  lng: number;
  habitaciones: number;
  banos: number;
  servicios: string[];
  amoblado: boolean;
  fotos: string[];
}

const ARRENDADORES = [
  {
    nombre: 'Marta Villamizar',
    email: 'marta.villamizar@ejemplo.com',
    telefono: '3145678901',
  },
  {
    nombre: 'Hernando Cristancho',
    email: 'hernando.cristancho@ejemplo.com',
    telefono: '3182345670',
  },
  {
    nombre: 'Gloria Peñaranda',
    email: 'gloria.penaranda@ejemplo.com',
    telefono: '3006789012',
  },
];

const ESTUDIANTES = [
  { nombre: 'Andres Felipe Rojas', email: 'andres.rojas@ejemplo.com', telefono: '3211234567' },
  { nombre: 'Laura Sofia Contreras', email: 'laura.contreras@ejemplo.com', telefono: '3159876543' },
  { nombre: 'Kevin Duarte', email: 'kevin.duarte@ejemplo.com', telefono: '3024567890' },
];

const INMUEBLES: SemillaInmueble[][] = [
  // Inmuebles de Marta Villamizar
  [
    {
      titulo: 'Habitacion amoblada a diez minutos de la Unipamplona',
      descripcion:
        'Habitacion independiente en casa de familia, con cama sencilla, escritorio, closet y ventana grande. El bano es compartido con otra estudiante. Incluye wifi, agua y luz. La casa es tranquila, ideal para estudiar. Se pide respeto con los horarios de descanso despues de las diez de la noche.',
      tipo: 'HABITACION',
      precio: 320000,
      barrio: 'El Buque',
      direccion: 'Calle 4 # 12-45',
      lat: 7.3711,
      lng: -72.6524,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'cocina', 'estudio'],
      amoblado: true,
      fotos: ['photo-1505693416388-ac5ce068fe85', 'photo-1522708323590-d24dbb6b0267'],
    },
    {
      titulo: 'Apartaestudio nuevo en el Centro con cocina integral',
      descripcion:
        'Apartaestudio recien remodelado a dos cuadras del parque principal. Tiene cocina integral, bano privado, closet empotrado y buena iluminacion natural. El edificio cuenta con porteria durante el dia. Perfecto para una persona o pareja de estudiantes. No incluye servicios publicos.',
      tipo: 'APARTAESTUDIO',
      precio: 620000,
      barrio: 'Centro',
      direccion: 'Carrera 6 # 5-28, apto 302',
      lat: 7.3768,
      lng: -72.6474,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'cocina', 'banoPrivado', 'vigilancia'],
      amoblado: false,
      fotos: [
        'photo-1502672260266-1c1ef2d93688',
        'photo-1484154218962-a197022b5858',
        'photo-1560448204-e02f11c3d0e2',
      ],
    },
    {
      titulo: 'Habitacion economica cerca del hospital San Juan de Dios',
      descripcion:
        'Habitacion sencilla con cama, mesa de noche y closet pequeño. Bano compartido entre tres habitaciones. Se comparte cocina y zona de lavado. Incluye agua y luz. Buena opcion para estudiantes de primeros semestres que buscan algo economico y central.',
      tipo: 'HABITACION',
      precio: 250000,
      barrio: 'Santa Marta',
      direccion: 'Calle 9 # 3-17',
      lat: 7.3792,
      lng: -72.6441,
      habitaciones: 1,
      banos: 1,
      servicios: ['agua', 'luz', 'cocina', 'lavadora'],
      amoblado: true,
      fotos: ['photo-1522771739844-6a9f6d5f14af', 'photo-1493809842364-78817add7ffb'],
    },
    {
      titulo: 'Apartamento de dos habitaciones para compartir entre estudiantes',
      descripcion:
        'Apartamento en segundo piso con dos habitaciones amplias, sala comedor, cocina y bano. Ideal para dos o tres estudiantes que quieran compartir gastos. Zona de ropas independiente con lavadora. El barrio es seguro y hay tienda y papeleria a media cuadra.',
      tipo: 'APARTAMENTO',
      precio: 850000,
      barrio: 'Cristo Rey',
      direccion: 'Carrera 11 # 8-60, apto 201',
      lat: 7.3814,
      lng: -72.6457,
      habitaciones: 2,
      banos: 1,
      servicios: ['wifi', 'cocina', 'lavadora', 'estudio'],
      amoblado: false,
      fotos: [
        'photo-1554995207-c18c203602cb',
        'photo-1586023492125-27b2c045efd7',
        'photo-1524758631624-e2822e304c36',
      ],
    },
  ],

  // Inmuebles de Hernando Cristancho
  [
    {
      titulo: 'Habitacion con bano privado frente a la ciudadela universitaria',
      descripcion:
        'Habitacion con bano privado, cama doble, escritorio grande y buen wifi. Queda cruzando la calle de la ciudadela, no necesitas transporte. Incluye todos los servicios y limpieza de zonas comunes una vez por semana. Se arrienda por semestre.',
      tipo: 'HABITACION',
      precio: 450000,
      barrio: 'El Escorial',
      direccion: 'Via Bucaramanga Km 1, casa 14',
      lat: 7.3688,
      lng: -72.6551,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'banoPrivado', 'estudio', 'vigilancia'],
      amoblado: true,
      fotos: [
        'photo-1571624436279-b272aff752b5',
        'photo-1502005229762-cf1b2da7c5d6',
        'photo-1598928506311-c55ded91a20c',
      ],
    },
    {
      titulo: 'Apartaestudio amoblado con parqueadero en Juan XXIII',
      descripcion:
        'Apartaestudio completamente amoblado: cama, nevera, estufa, mesa de estudio y television. Tiene parqueadero para moto incluido en el precio. El sector es tranquilo y hay ruta de buseta cada quince minutos hacia la universidad. Contrato minimo de seis meses.',
      tipo: 'APARTAESTUDIO',
      precio: 700000,
      barrio: 'Juan XXIII',
      direccion: 'Calle 14 # 7-22',
      lat: 7.3739,
      lng: -72.6508,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'cocina', 'banoPrivado', 'parqueadero', 'television'],
      amoblado: true,
      fotos: ['photo-1560185007-cde436f6a4d0', 'photo-1502672260266-1c1ef2d93688'],
    },
    {
      titulo: 'Casa completa para grupo de estudiantes en La Feria',
      descripcion:
        'Casa de tres habitaciones con patio, sala, comedor, cocina amplia y dos banos. Pensada para un grupo de tres a cinco estudiantes que quieran vivir juntos y repartir el arriendo. Acepta mascotas pequeñas. Se entrega sin muebles pero con cocina y calentador instalados.',
      tipo: 'CASA',
      precio: 1250000,
      barrio: 'La Feria',
      direccion: 'Carrera 2 # 16-40',
      lat: 7.3748,
      lng: -72.6428,
      habitaciones: 3,
      banos: 2,
      servicios: ['cocina', 'lavadora', 'mascotas', 'parqueadero'],
      amoblado: false,
      fotos: ['photo-1583847268964-b28dc8f51f92', 'photo-1554995207-c18c203602cb'],
    },
  ],

  // Inmuebles de Gloria Peñaranda
  [
    {
      titulo: 'Habitacion para chica en casa de familia, sector Ursua',
      descripcion:
        'Habitacion en casa de familia donde vive una señora sola. Se arrienda unicamente a estudiante mujer. Incluye desayuno de lunes a viernes, wifi y todos los servicios. Ambiente familiar y muy seguro, ideal para quien viene de otra ciudad por primera vez.',
      tipo: 'HABITACION',
      precio: 380000,
      barrio: 'Ursua',
      direccion: 'Calle 7 # 10-33',
      lat: 7.3823,
      lng: -72.6487,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'cocina', 'lavadora'],
      amoblado: true,
      fotos: ['photo-1493809842364-78817add7ffb', 'photo-1505693416388-ac5ce068fe85'],
    },
    {
      titulo: 'Apartamento amoblado de dos alcobas en San Francisco',
      descripcion:
        'Apartamento amoblado con dos alcobas, sala comedor, cocina integral y bano social. Cuenta con calentador de agua, wifi de fibra optica y television. Queda a diez minutos caminando del centro y a quince de la universidad. Se pide deposito de un mes.',
      tipo: 'APARTAMENTO',
      precio: 1100000,
      barrio: 'San Francisco',
      direccion: 'Carrera 8 # 4-15, apto 401',
      lat: 7.3781,
      lng: -72.6497,
      habitaciones: 2,
      banos: 2,
      servicios: ['wifi', 'cocina', 'lavadora', 'television', 'vigilancia', 'estudio'],
      amoblado: true,
      fotos: [
        'photo-1586023492125-27b2c045efd7',
        'photo-1524758631624-e2822e304c36',
        'photo-1560448204-e02f11c3d0e2',
      ],
    },
    {
      titulo: 'Habitacion doble para compartir entre dos estudiantes',
      descripcion:
        'Habitacion grande con dos camas sencillas, dos closets y dos escritorios, pensada para que la compartan dos personas y el arriendo salga mas barato por cabeza. Bano compartido con otra habitacion. Incluye wifi y servicios. Cocina de uso comun.',
      tipo: 'HABITACION',
      precio: 300000,
      barrio: 'Chichira',
      direccion: 'Calle 2 # 18-09',
      lat: 7.3664,
      lng: -72.6574,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'cocina', 'estudio'],
      amoblado: true,
      fotos: ['photo-1522771739844-6a9f6d5f14af', 'photo-1571624436279-b272aff752b5'],
    },
  ],
];

const RESENAS = [
  {
    indiceEstudiante: 0,
    indiceArrendador: 0,
    calificacion: 5,
    comentario:
      'Vivi un semestre completo en una de sus habitaciones y todo fue muy claro desde el principio. El precio que me dijo fue el que pague, sin cobros raros. Muy recomendada.',
  },
  {
    indiceEstudiante: 1,
    indiceArrendador: 0,
    calificacion: 4,
    comentario:
      'Buena arrendadora, atenta y cumplida con los arreglos. Lo unico es que el wifi a veces se cae en las noches, pero lo soluciono cuando le avise.',
  },
  {
    indiceEstudiante: 2,
    indiceArrendador: 1,
    calificacion: 5,
    comentario:
      'Don Hernando me entrego la habitacion tal cual estaba en las fotos. Queda al frente de la ciudadela asi que me ahorro el pasaje todos los dias. Excelente.',
  },
  {
    indiceEstudiante: 0,
    indiceArrendador: 2,
    calificacion: 4,
    comentario:
      'La señora Gloria es muy amable y la casa es segura. El desayuno incluido si se cumple. Recomendado sobre todo si vienes de otra ciudad y no conoces a nadie.',
  },
];

/**
 * Historial de precios de ejemplo, para que la funcion se vea desde el primer dia.
 * El indice es la posicion del inmueble dentro del grupo de su arrendador.
 */
const HISTORIALES = [
  {
    indiceArrendador: 0,
    indiceInmueble: 3,
    cambios: [
      { anterior: 700000, nuevo: 780000, hace: 240 },
      { anterior: 780000, nuevo: 850000, hace: 95 },
    ],
  },
  {
    indiceArrendador: 1,
    indiceInmueble: 0,
    cambios: [{ anterior: 420000, nuevo: 450000, hace: 140 }],
  },
  {
    indiceArrendador: 2,
    indiceInmueble: 1,
    cambios: [{ anterior: 1200000, nuevo: 1100000, hace: 60 }],
  },
];

const haceDias = (dias: number): Date => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

async function main(): Promise<void> {
  process.stdout.write('Limpiando datos anteriores de la semilla...\n');

  const correos = [...ARRENDADORES, ...ESTUDIANTES].map((u) => u.email);
  await prisma.usuario.deleteMany({ where: { email: { in: correos } } });

  // Las cuentas que crean las pruebas de la API terminan en @test.com y no aportan nada.
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@test.com' } } });

  const passwordHash = await bcrypt.hash('pamplona2026', 10);

  process.stdout.write('Creando arrendadores y estudiantes de ejemplo...\n');

  const arrendadores = await Promise.all(
    ARRENDADORES.map((datos) =>
      prisma.usuario.create({
        data: { ...datos, passwordHash, rol: 'ARRENDADOR' },
      }),
    ),
  );

  const estudiantes = await Promise.all(
    ESTUDIANTES.map((datos) =>
      prisma.usuario.create({
        data: { ...datos, passwordHash, rol: 'ESTUDIANTE' },
      }),
    ),
  );

  process.stdout.write('Creando inmuebles...\n');

  let total = 0;
  const creados: string[][] = [];

  for (const [indice, grupo] of INMUEBLES.entries()) {
    const arrendador = arrendadores[indice];
    const idsDelGrupo: string[] = [];

    for (const semilla of grupo) {
      const { fotos, ...campos } = semilla;
      const inmueble = await prisma.inmueble.create({
        data: {
          ...campos,
          arrendadorId: arrendador.id,
          fotos: {
            create: fotos.map((id, orden) => ({
              url: foto(id),
              publicId: `semilla/${id}`,
              orden,
            })),
          },
        },
      });
      idsDelGrupo.push(inmueble.id);
      total += 1;
    }

    creados.push(idsDelGrupo);
  }

  process.stdout.write('Creando historial de precios...\n');

  let totalCambios = 0;
  for (const historial of HISTORIALES) {
    const inmuebleId = creados[historial.indiceArrendador]?.[historial.indiceInmueble];
    if (!inmuebleId) continue;

    for (const cambio of historial.cambios) {
      await prisma.cambioDePrecio.create({
        data: {
          inmuebleId,
          precioAnterior: cambio.anterior,
          precioNuevo: cambio.nuevo,
          creadoEn: haceDias(cambio.hace),
        },
      });
      totalCambios += 1;
    }
  }

  process.stdout.write('Creando resenas...\n');

  for (const resena of RESENAS) {
    const arrendador = arrendadores[resena.indiceArrendador];
    const primerInmueble = await prisma.inmueble.findFirst({
      where: { arrendadorId: arrendador.id },
      orderBy: { creadoEn: 'asc' },
    });

    await prisma.resena.create({
      data: {
        autorId: estudiantes[resena.indiceEstudiante].id,
        arrendadorId: arrendador.id,
        inmuebleId: primerInmueble?.id ?? null,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
      },
    });
  }

  process.stdout.write(
    `\nListo. ${total} inmuebles, ${arrendadores.length} arrendadores, ${estudiantes.length} estudiantes, ` +
      `${RESENAS.length} resenas y ${totalCambios} cambios de precio.\n` +
      `Cuentas de prueba (todas con la contrasena pamplona2026):\n` +
      `  Arrendador: ${ARRENDADORES[0].email}\n` +
      `  Estudiante: ${ESTUDIANTES[0].email}\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Fallo la semilla: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
