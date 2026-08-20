import { PrismaClient, type TipoInmueble } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { claveDeBarrio } from '../src/lib/barrios.js';

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
    descripcion:
      'Llevo doce años arrendándole a estudiantes de la Unipamplona. Trato directo, sin intermediarios, y el precio que digo es el que se paga.',
  },
  {
    nombre: 'Hernando Cristancho',
    email: 'hernando.cristancho@ejemplo.com',
    telefono: '3182345670',
    descripcion:
      'Vivo en el mismo edificio, así que cualquier cosa que se dañe la arreglo el mismo día. Pido silencio después de las once y nada más.',
  },
  {
    nombre: 'Gloria Peñaranda',
    email: 'gloria.penaranda@ejemplo.com',
    telefono: '3006789012',
    descripcion:
      'Arriendo dos habitaciones en mi casa. Me gusta conocer a quien va a vivir aquí antes de entregar llaves, así estamos tranquilos los dos.',
  },
];

const ESTUDIANTES = [
  {
    nombre: 'Andrés Felipe Rojas',
    email: 'andres.rojas@ejemplo.com',
    telefono: '3211234567',
    descripcion: 'Estudio Ingeniería de Sistemas, voy en sexto semestre. Tranquilo y ordenado.',
  },
  {
    nombre: 'Laura Sofía Contreras',
    email: 'laura.contreras@ejemplo.com',
    telefono: '3159876543',
    descripcion: 'Estudio Derecho. Me levanto temprano y estudio en la casa casi todos los días.',
  },
  { nombre: 'Kevin Duarte', email: 'kevin.duarte@ejemplo.com', telefono: '3024567890', descripcion: null },
  {
    nombre: 'Valentina Peñaloza',
    email: 'valentina.penaloza@ejemplo.com',
    telefono: '3187654321',
    descripcion: 'Segundo semestre de Psicología. Vengo de Cúcuta y no conozco a casi nadie aquí.',
  },
  { nombre: 'Sebastián Ortega', email: 'sebastian.ortega@ejemplo.com', telefono: '3143216549', descripcion: null },
  {
    nombre: 'Juan David Carvajal',
    email: 'juan.carvajal@ejemplo.com',
    telefono: '3126549870',
    descripcion: 'Estudio Zootecnia. Salgo temprano a las prácticas, así que necesito quedar cerca de la vía.',
  },
  {
    nombre: 'Mariana Suárez',
    email: 'mariana.suarez@ejemplo.com',
    telefono: '3197412580',
    descripcion: 'Enfermería, séptimo semestre. Hago turnos en el hospital y a veces llego tarde en la noche.',
  },
  { nombre: 'Brayan Estiven Parra', email: 'brayan.parra@ejemplo.com', telefono: '3134569871', descripcion: null },
];

/*
  Opiniones sobre los barrios.

  Van TRES POR CADA BARRIO en el que hay algo publicado, y ese numero no es
  gratuito: la pagina solo muestra el promedio cuando hay tres o mas. Con dos
  sale el aviso de que todavia nadie ha contado como es vivir ahi, que es
  justo lo que hacia ver la seccion vacia en las fichas de los barrios que
  faltaban.

  Una persona no puede opinar dos veces del mismo barrio -- la base lo
  impide -- asi que las opiniones se reparten entre los ocho estudiantes.
*/
const RESENAS_DE_BARRIO: {
  barrio: string;
  indiceEstudiante: number;
  tranquilidad: number;
  seguridad: number;
  transporte: number;
  comentario: string;
}[] = [
  {
    barrio: 'El Buque',
    indiceEstudiante: 0,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Viví dos semestres ahí y se estudia bien de noche. Pasa buseta cada cinco minutos por la avenida y de todas formas uno llega a la U caminando en quince minutos.',
  },
  {
    barrio: 'El Buque',
    indiceEstudiante: 1,
    tranquilidad: 3,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Sobre la avenida sí se oye el tráfico hasta tarde, pero entrando a las calles internas es callado. Nunca tuve problemas volviendo de noche.',
  },
  {
    barrio: 'El Buque',
    indiceEstudiante: 3,
    tranquilidad: 4,
    seguridad: 3,
    transporte: 5,
    comentario:
      'Muy bien ubicado y con tiendas cerca. Lo único es que hay tramos con poca luz, así que de madrugada mejor no devolverse sola.',
  },
  {
    barrio: 'Centro',
    indiceEstudiante: 2,
    tranquilidad: 2,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Todo queda a mano: bancos, papelerías, almuerzos baratos. Pero el ruido del comercio empieza a las seis de la mañana y los fines de semana hay música hasta tarde.',
  },
  {
    barrio: 'Centro',
    indiceEstudiante: 0,
    tranquilidad: 2,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Para quien madruga a clase es lo mejor, no se gasta un peso en transporte. Para dormir en semana de parciales no es el sitio, uno se acostumbra pero cuesta.',
  },
  {
    barrio: 'Centro',
    indiceEstudiante: 4,
    tranquilidad: 3,
    seguridad: 5,
    transporte: 5,
    comentario:
      'Siempre hay gente en la calle, eso lo hace seguro a cualquier hora. El ruido depende mucho de la cuadra: sobre el parque es pesado, una calle atrás ya no.',
  },
  {
    barrio: 'La Feria',
    indiceEstudiante: 1,
    tranquilidad: 5,
    seguridad: 3,
    transporte: 2,
    comentario:
      'Es de los barrios más callados y las casas son grandes y baratas. El problema es el transporte: la buseta pasa cada media hora y después de las ocho ya casi no sube.',
  },
  {
    barrio: 'La Feria',
    indiceEstudiante: 3,
    tranquilidad: 5,
    seguridad: 3,
    transporte: 2,
    comentario:
      'Si te gusta la tranquilidad es perfecto y el arriendo rinde mucho más. Toca organizarse con los horarios porque bajar a la U a pie son como treinta minutos.',
  },
  {
    barrio: 'La Feria',
    indiceEstudiante: 2,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 2,
    comentario:
      'Vecinos muy amables y nunca vi nada raro. Lo del transporte sí es real, si vas a coger clases de siete de la noche piénsalo dos veces.',
  },
  {
    barrio: 'Chichira',
    indiceEstudiante: 0,
    tranquilidad: 5,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Es de lo más callado que hay estando tan cerca de la U: se llega caminando en menos de quince minutos y no toca coger buseta. De noche no pasa casi nadie, así que uno duerme bien.',
  },
  {
    barrio: 'Chichira',
    indiceEstudiante: 5,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Viví ahí un año. Hay tienda y papelería a la vuelta, y para lo demás toca bajar al centro. La subida de vuelta cansa los primeros días y después ya ni se siente.',
  },
  {
    barrio: 'Chichira',
    indiceEstudiante: 6,
    tranquilidad: 5,
    seguridad: 3,
    transporte: 3,
    comentario:
      'Muy tranquilo para estudiar y el arriendo rinde más que en el centro. Hay tramos con poca luz, así que volviendo de un turno de noche prefiero venirme acompañada.',
  },

  {
    barrio: 'Santa Marta',
    indiceEstudiante: 1,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 4,
    comentario:
      'Barrio de familias de toda la vida, no de estudiantes de fiesta. Eso se agradece en época de parciales. Queda cerca del hospital y pasa buseta seguido por la principal.',
  },
  {
    barrio: 'Santa Marta',
    indiceEstudiante: 4,
    tranquilidad: 4,
    seguridad: 5,
    transporte: 4,
    comentario:
      'De los barrios donde más seguro me he sentido volviendo tarde. Siempre hay vecinos en las puertas y todo el mundo se conoce.',
  },
  {
    barrio: 'Santa Marta',
    indiceEstudiante: 7,
    tranquilidad: 3,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Bien ubicado y con transporte a toda hora. Lo único es que sobre la vía principal se oyen los carros desde temprano.',
  },

  {
    barrio: 'Cristo Rey',
    indiceEstudiante: 2,
    tranquilidad: 5,
    seguridad: 4,
    transporte: 2,
    comentario:
      'La vista de la ciudad desde allá arriba es lo mejor que tiene, y es callado de verdad. Pero es subida pura: con bolsas de mercado se sufre.',
  },
  {
    barrio: 'Cristo Rey',
    indiceEstudiante: 5,
    tranquilidad: 5,
    seguridad: 3,
    transporte: 2,
    comentario:
      'Los arriendos son de los más baratos y las casas grandes. La buseta sube poco, así que la mayoría bajamos caminando y subimos en taxi cuando llueve.',
  },
  {
    barrio: 'Cristo Rey',
    indiceEstudiante: 3,
    tranquilidad: 4,
    seguridad: 3,
    transporte: 2,
    comentario:
      'Tranquilo y con buenos vecinos. Si tienes clase a primera hora piénsalo, porque bajar son veinte minutos largos y en la mañana hace un frío bravo.',
  },

  {
    barrio: 'El Escorial',
    indiceEstudiante: 0,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 4,
    comentario:
      'Es de los barrios más nuevos: las casas están mejor terminadas y no hay tanta humedad como en el centro. Se llega a la U en buseta en diez minutos.',
  },
  {
    barrio: 'El Escorial',
    indiceEstudiante: 6,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Callado y limpio. Lo que hace falta es comercio: para un almuerzo o una fotocopia toca salir del barrio.',
  },
  {
    barrio: 'El Escorial',
    indiceEstudiante: 7,
    tranquilidad: 5,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Se estudia bien de noche, no se oye nada. La buseta deja de pasar temprano, eso sí: después de las nueve toca taxi.',
  },

  {
    barrio: 'Juan XXIII',
    indiceEstudiante: 1,
    tranquilidad: 3,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Muy bien conectado, pasa transporte a cada rato y hay tiendas abiertas hasta tarde. A cambio siempre hay movimiento en la calle.',
  },
  {
    barrio: 'Juan XXIII',
    indiceEstudiante: 4,
    tranquilidad: 3,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Para quien no quiere depender de horarios de buseta es buenísimo. El ruido es de calle normal, no de bar; uno se acostumbra en dos semanas.',
  },
  {
    barrio: 'Juan XXIII',
    indiceEstudiante: 5,
    tranquilidad: 4,
    seguridad: 3,
    transporte: 5,
    comentario:
      'Nunca me pasó nada, pero de madrugada hay cuadras solas. Por lo demás, es de los sitios donde menos se gasta uno en pasajes.',
  },

  {
    barrio: 'Ursua',
    indiceEstudiante: 2,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Barrio residencial y bastante callado. Se llega caminando a la U en veinte minutos y en buseta en cinco, así que uno decide según la pereza.',
  },
  {
    barrio: 'Ursua',
    indiceEstudiante: 6,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Las casas son amplias y hay varias que arriendan por habitación. La zona es tranquila, aunque de noche hay poco movimiento y eso a algunos les pesa.',
  },
  {
    barrio: 'Ursua',
    indiceEstudiante: 3,
    tranquilidad: 5,
    seguridad: 4,
    transporte: 3,
    comentario:
      'Me quedé dos semestres y volvería. Silencioso, vecinos amables y el arriendo más barato que en el centro por el mismo espacio.',
  },

  {
    barrio: 'San Francisco',
    indiceEstudiante: 0,
    tranquilidad: 3,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Está pegado al centro sin ser el centro: se camina a todo y no hay el ruido del comercio. Para mí es el mejor equilibrio de la ciudad.',
  },
  {
    barrio: 'San Francisco',
    indiceEstudiante: 4,
    tranquilidad: 3,
    seguridad: 5,
    transporte: 5,
    comentario:
      'Siempre hay gente pasando, lo que lo hace seguro a cualquier hora. Los apartamentos son de los más caros, eso hay que tenerlo claro.',
  },
  {
    barrio: 'San Francisco',
    indiceEstudiante: 7,
    tranquilidad: 4,
    seguridad: 4,
    transporte: 5,
    comentario:
      'Viví ahí en primer semestre sin conocer a nadie y fue fácil moverse: todo queda a diez minutos a pie. Los fines de semana sí se siente más movido.',
  },
];

const INMUEBLES: SemillaInmueble[][] = [
  // Inmuebles de Marta Villamizar
  [
    {
      titulo: 'Habitación amoblada a diez minutos de la Unipamplona',
      descripcion:
        'Habitación independiente en casa de familia, con cama sencilla, escritorio, closet y ventana grande. El baño es compartido con otra estudiante. Incluye wifi, agua y luz. La casa es tranquila, ideal para estudiar. Se pide respeto con los horarios de descanso después de las diez de la noche.',
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
        'Apartaestudio recién remodelado a dos cuadras del parque principal. Tiene cocina integral, baño privado, closet empotrado y buena iluminación natural. El edificio cuenta con portería durante el día. Perfecto para una persona o pareja de estudiantes. No incluye servicios públicos.',
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
      titulo: 'Habitación económica cerca del hospital San Juan de Dios',
      descripcion:
        'Habitación sencilla con cama, mesa de noche y closet pequeño. Baño compartido entre tres habitaciones. Se comparte cocina y zona de lavado. Incluye agua y luz. Buena opción para estudiantes de primeros semestres que buscan algo económico y central.',
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
        'Apartamento en segundo piso con dos habitaciones amplias, sala comedor, cocina y baño. Ideal para dos o tres estudiantes que quieran compartir gastos. Zona de ropas independiente con lavadora. El barrio es seguro y hay tienda y papelería a media cuadra.',
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
    {
      titulo: 'Habitación con entrada independiente en El Buque',
      descripcion:
        'Habitación en primer piso con puerta a la calle, cama doble, closet y baño compartido con una sola persona más. Incluye wifi y servicios. Queda subiendo dos cuadras desde la avenida, así que se llega caminando a la universidad sin coger buseta.',
      tipo: 'HABITACION',
      precio: 340000,
      barrio: 'El Buque',
      direccion: 'Calle 6 # 11-22',
      lat: 7.3718,
      lng: -72.6531,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'estudio'],
      amoblado: true,
      fotos: ['photo-1522708323590-d24dbb6b0267', 'photo-1505693416388-ac5ce068fe85'],
    },
    {
      titulo: 'Habitación económica en El Buque para primeros semestres',
      descripcion:
        'Habitación sencilla con cama, escritorio y closet pequeño. Baño y cocina compartidos con otras dos habitaciones. Incluye agua y luz, el wifi se reparte entre todos. Buena opción para quien llega por primera vez y quiere gastar poco mientras se ubica.',
      tipo: 'HABITACION',
      precio: 280000,
      barrio: 'El Buque',
      direccion: 'Carrera 12 # 5-70',
      lat: 7.3705,
      lng: -72.6519,
      habitaciones: 1,
      banos: 1,
      servicios: ['agua', 'luz', 'cocina'],
      amoblado: false,
      fotos: ['photo-1560448204-e02f11c3d0e2'],
    },
    {
      titulo: 'Apartaestudio en el Centro sobre la calle principal',
      descripcion:
        'Apartaestudio de un ambiente con cocineta, baño privado y balcón pequeño. Queda sobre la calle principal, así que hay algo de ruido en el día pero todo queda a un paso: almuerzos, papelerías y bancos. No incluye servicios públicos.',
      tipo: 'APARTAESTUDIO',
      precio: 640000,
      barrio: 'Centro',
      direccion: 'Calle 5 # 6-18',
      lat: 7.3762,
      lng: -72.6489,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'cocina'],
      amoblado: false,
      fotos: ['photo-1502672260266-1c1ef2d93688'],
    },
    {
      titulo: 'Habitación en el Centro a una cuadra del parque',
      descripcion:
        'Habitación con cama doble, closet y ventana interna, así que entra poco ruido de la calle. Baño compartido con otra habitación. Incluye agua, luz y wifi. Queda a una cuadra del parque principal, con todo a mano y buseta en la esquina.',
      tipo: 'HABITACION',
      precio: 350000,
      barrio: 'Centro',
      direccion: 'Calle 4 # 5-27',
      lat: 7.3768,
      lng: -72.6493,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'cocina'],
      amoblado: true,
      fotos: ['photo-1505693416388-ac5ce068fe85'],
    },
  ],

  // Inmuebles de Hernando Cristancho
  [
    {
      titulo: 'Habitación con baño privado frente a la ciudadela universitaria',
      descripcion:
        'Habitación con baño privado, cama doble, escritorio grande y buen wifi. Queda cruzando la calle de la ciudadela, no necesitas transporte. Incluye todos los servicios y limpieza de zonas comunes una vez por semana. Se arrienda por semestre.',
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
        'Apartaestudio completamente amoblado: cama, nevera, estufa, mesa de estudio y televisión. Tiene parqueadero para moto incluido en el precio. El sector es tranquilo y hay ruta de buseta cada quince minutos hacia la universidad. Contrato mínimo de seis meses.',
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
        'Casa de tres habitaciones con patio, sala, comedor, cocina amplia y dos baños. Pensada para un grupo de tres a cinco estudiantes que quieran vivir juntos y repartir el arriendo. Acepta mascotas pequeñas. Se entrega sin muebles pero con cocina y calentador instalados.',
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
    {
      titulo: 'Habitación amplia en el Centro con baño privado',
      descripcion:
        'Habitación grande en segundo piso con baño propio, cama doble, escritorio y ventana a la calle. Incluye todos los servicios y wifi. El edificio tiene portería. Se arrienda por semestre y se pide silencio después de las once de la noche.',
      tipo: 'HABITACION',
      precio: 400000,
      barrio: 'Centro',
      direccion: 'Carrera 6 # 4-35',
      lat: 7.3771,
      lng: -72.6482,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'bano', 'vigilancia'],
      amoblado: true,
      fotos: ['photo-1595526114035-0d45ed16cfbf', 'photo-1522708323590-d24dbb6b0267'],
    },
    {
      titulo: 'Apartaestudio remodelado en el Centro, segundo piso',
      descripcion:
        'Apartaestudio con cocina integral, baño privado y buena luz natural. Recién pintado. La entrada se comparte con un solo apartamento más. Ideal para una persona o pareja de estudiantes que quiera privacidad sin pagar un apartamento completo.',
      tipo: 'APARTAESTUDIO',
      precio: 680000,
      barrio: 'Centro',
      direccion: 'Calle 3 # 7-40',
      lat: 7.3756,
      lng: -72.6497,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'cocina', 'bano'],
      amoblado: true,
      fotos: ['photo-1493809842364-78817add7ffb'],
    },
    {
      titulo: 'Habitación en La Feria con desayuno incluido',
      descripcion:
        'Habitación en casa de familia donde vive una pareja mayor. Incluye desayuno de lunes a viernes, wifi y todos los servicios. Ambiente muy tranquilo y seguro. Se busca alguien juicioso que respete los horarios de la casa.',
      tipo: 'HABITACION',
      precio: 310000,
      barrio: 'La Feria',
      direccion: 'Calle 15 # 4-19',
      lat: 7.3838,
      lng: -72.6435,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz'],
      amoblado: true,
      fotos: ['photo-1595526114035-0d45ed16cfbf'],
    },
  ],

  // Inmuebles de Gloria Peñaranda
  [
    {
      titulo: 'Habitación para chica en casa de familia, sector Ursua',
      descripcion:
        'Habitación en casa de familia donde vive una señora sola. Se arrienda únicamente a estudiante mujer. Incluye desayuno de lunes a viernes, wifi y todos los servicios. Ambiente familiar y muy seguro, ideal para quien viene de otra ciudad por primera vez.',
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
        'Apartamento amoblado con dos alcobas, sala comedor, cocina integral y baño social. Cuenta con calentador de agua, wifi de fibra optica y televisión. Queda a diez minutos caminando del centro y a quince de la universidad. Se pide deposito de un mes.',
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
      titulo: 'Habitación doble para compartir entre dos estudiantes',
      descripcion:
        'Habitación grande con dos camas sencillas, dos closets y dos escritorios, pensada para que la compartan dos personas y el arriendo salga mas barato por cabeza. Baño compartido con otra habitación. Incluye wifi y servicios. Cocina de uso común.',
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
    {
      titulo: 'Habitación en La Feria en casa de familia',
      descripcion:
        'Habitación en casa de familia, con cama sencilla, closet y escritorio. Baño compartido. Incluye agua, luz y wifi. El barrio es muy callado, ideal para quien necesita concentrarse. Hay que contar con la buseta o con treinta minutos caminando hasta la universidad.',
      tipo: 'HABITACION',
      precio: 260000,
      barrio: 'La Feria',
      direccion: 'Calle 14 # 3-52',
      lat: 7.3831,
      lng: -72.6442,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz'],
      amoblado: true,
      fotos: ['photo-1560185007-cde436f6a4d0'],
    },
    {
      titulo: 'Habitación grande en La Feria con zona de estudio',
      descripcion:
        'Habitación amplia con espacio para escritorio grande y estantería. Baño compartido entre dos. Incluye servicios. La casa tiene patio y zona de ropas. El barrio es tranquilo y los vecinos son de toda la vida, pero la buseta pasa cada media hora.',
      tipo: 'HABITACION',
      precio: 290000,
      barrio: 'La Feria',
      direccion: 'Carrera 4 # 13-08',
      lat: 7.3824,
      lng: -72.6451,
      habitaciones: 1,
      banos: 1,
      servicios: ['wifi', 'agua', 'luz', 'estudio', 'lavadora'],
      amoblado: false,
      fotos: ['photo-1522771739844-6a9f6d5f14af'],
    },
    {
      titulo: 'Habitación sencilla en el Centro, económica',
      descripcion:
        'Habitación pequeña pero suficiente, con cama sencilla, closet y espacio para escritorio. Baño y cocina compartidos con dos habitaciones más. Incluye agua y luz. Sale barata porque es interior y no tiene ventana a la calle.',
      tipo: 'HABITACION',
      precio: 270000,
      barrio: 'Centro',
      direccion: 'Carrera 7 # 3-14',
      lat: 7.3759,
      lng: -72.6501,
      habitaciones: 1,
      banos: 1,
      servicios: ['agua', 'luz', 'cocina'],
      amoblado: false,
      fotos: ['photo-1560448204-e02f11c3d0e2'],
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
      'Buena arrendadora, atenta y cumplida con los arreglos. Lo único es que el wifi a veces se cae en las noches, pero lo soluciono cuando le avise.',
  },
  {
    indiceEstudiante: 2,
    indiceArrendador: 1,
    calificacion: 5,
    comentario:
      'Don Hernando me entrego la habitación tal cual estaba en las fotos. Queda al frente de la ciudadela así que me ahorro el pasaje todos los días. Excelente.',
  },
  {
    indiceEstudiante: 0,
    indiceArrendador: 2,
    calificacion: 4,
    comentario:
      'La señora Gloria es muy amable y la casa es segura. El desayuno incluido si se cumple. Recomendado sobre todo si vienes de otra ciudad y no conoces a nadie.',
  },  {
    indiceEstudiante: 4,
    indiceArrendador: 0,
    calificacion: 5,
    comentario:
      'Me arrendó sin conocerme de nada y me trató como si llevara años ahí. Cuando se dañó la ducha mandó al plomero al otro día.',
  },
  {
    indiceEstudiante: 5,
    indiceArrendador: 1,
    calificacion: 4,
    comentario:
      'Todo tal cual lo publicado. Es estricto con el silencio después de las once, pero eso lo avisa desde el principio y a mí me sirvió para estudiar.',
  },
  {
    indiceEstudiante: 3,
    indiceArrendador: 1,
    calificacion: 5,
    comentario:
      'Vivi año y medio en su apartamento. Nunca me subió el arriendo a mitad de semestre y siempre respondió el teléfono.',
  },
  {
    indiceEstudiante: 6,
    indiceArrendador: 2,
    calificacion: 5,
    comentario:
      'Me recibió recién llegada de Cúcuta y hasta me explicó qué buseta coger. La casa es limpia y el barrio callado.',
  },
  {
    indiceEstudiante: 7,
    indiceArrendador: 2,
    calificacion: 4,
    comentario:
      'Buen trato y precio justo. Lo único es que el agua caliente a veces demora, pero la señora Gloria avisó de eso antes de que firmáramos.',
  },
  {
    indiceEstudiante: 1,
    indiceArrendador: 2,
    calificacion: 5,
    comentario:
      'Es de las pocas que muestra la habitación en persona antes de pedir plata. Eso solo ya da confianza.',
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

/**
 * Hace cuantos dias se publico cada inmueble, contando en el mismo orden en que
 * aparecen arriba. Se reparten a proposito: si todos fueran de hoy, la insignia
 * de recien publicado saldria en los diez y dejaria de significar algo.
 */
const DIAS_DESDE_PUBLICACION = [3, 42, 96, 18, 11, 27, 63, 6, 130, 61, 34, 8, 15, 9, 75, 150, 52, 20, 88, 4, 47];

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
          creadoEn: haceDias(DIAS_DESDE_PUBLICACION[total] ?? 90),
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

  process.stdout.write('Creando reseñas...\n');

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

  process.stdout.write('Creando opiniones de barrio...\n');

  for (const opinion of RESENAS_DE_BARRIO) {
    await prisma.resenaBarrio.create({
      data: {
        autorId: estudiantes[opinion.indiceEstudiante].id,
        barrio: opinion.barrio,
        clave: claveDeBarrio(opinion.barrio),
        tranquilidad: opinion.tranquilidad,
        seguridad: opinion.seguridad,
        transporte: opinion.transporte,
        comentario: opinion.comentario,
      },
    });
  }

  process.stdout.write(
    `\nListo. ${total} inmuebles, ${arrendadores.length} arrendadores, ${estudiantes.length} estudiantes, ` +
      `${RESENAS.length} reseñas, ${RESENAS_DE_BARRIO.length} opiniones de barrio ` +
      `y ${totalCambios} cambios de precio.\n` +
      `Cuentas de prueba (todas con la contraseña pamplona2026):\n` +
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
