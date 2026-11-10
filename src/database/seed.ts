import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { Catalogo } from '../catalogos/entities/catalogo.entity';
import { Configuracion } from '../catalogos/entities/configuracion.entity';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import { Roles, TipoCatalogo } from '../common/enums';
import { clave } from '../common/texto';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

const CATALOGOS: Partial<Record<TipoCatalogo, string[]>> = {
  [TipoCatalogo.Rubro]: [
    'Minería',
    'Tecnología',
    'Comercio',
    'Salud',
    'Educación',
    'Construcción',
    'Servicios',
  ],
  [TipoCatalogo.TipoContrato]: [
    'Indefinido',
    'Plazo fijo',
    'Pasantía',
    'Consultoría',
  ],
  [TipoCatalogo.Modalidad]: ['Presencial', 'Remoto', 'Híbrido'],
};

const DEPARTAMENTOS = [
  'Oruro',
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
];

const MUNICIPIOS_ORURO = [
  'Oruro',
  'Caracollo',
  'El Choro',
  'Soracachi',
  'Challapata',
  'Huanuni',
  'Machacamarca',
  'Poopó',
  'Pazña',
  'Antequera',
  'Salinas de Garci Mendoza',
  'Toledo',
  'Curahuara de Carangas',
  'Turco',
  'Corque',
  'Eucaliptus',
];

/**
 * Áreas profesionales con sus profesiones y habilidades. Al elegir una
 * profesión, la oferta sugiere primero las habilidades de su área.
 */
const AREAS: Record<string, { profesiones: string[]; habilidades: string[] }> =
  {
    'Tecnologías de la información': {
      profesiones: [
        'Ingeniería de Sistemas',
        'Ingeniería Informática',
        'Ingeniería de Software',
        'Técnico Superior en Sistemas Informáticos',
        'Ingeniería en Redes y Telecomunicaciones',
      ],
      habilidades: [
        'JavaScript',
        'TypeScript',
        'Python',
        'PHP',
        'Java',
        'Laravel',
        'Django',
        'NestJS',
        'Vue.js',
        'React',
        'PostgreSQL',
        'MySQL',
        'Docker',
        'Git',
        'Linux',
        'Redes',
        'Soporte técnico',
      ],
    },
    'Minería y metalurgia': {
      profesiones: [
        'Ingeniería de Minas',
        'Ingeniería Metalúrgica',
        'Ingeniería Geológica',
        'Ingeniería Química',
        'Técnico Superior en Minería',
      ],
      habilidades: [
        'Seguridad e higiene minera',
        'Perforación y voladura',
        'Procesamiento de minerales',
        'Análisis químico de minerales',
        'Planificación minera',
        'Ventilación de minas',
      ],
    },
    'Ingeniería civil y construcción': {
      profesiones: [
        'Ingeniería Civil',
        'Arquitectura',
        'Técnico Superior en Construcción Civil',
        'Técnico Superior en Topografía y Geodesia',
      ],
      habilidades: [
        'AutoCAD',
        'Civil 3D',
        'Revit',
        'Topografía',
        'Manejo de estación total',
        'Cómputos métricos y presupuestos de obra',
        'Supervisión de obras',
        'Lectura de planos',
      ],
    },
    'Industria, electricidad y mecánica': {
      profesiones: [
        'Ingeniería Industrial',
        'Ingeniería Eléctrica',
        'Ingeniería Electrónica',
        'Ingeniería Mecánica',
        'Ingeniería Electromecánica',
      ],
      habilidades: [
        'Mantenimiento industrial',
        'Instalaciones eléctricas',
        'Automatización y PLC',
        'Seguridad industrial',
        'Gestión de la calidad (ISO 9001)',
      ],
    },
    Salud: {
      profesiones: [
        'Medicina',
        'Enfermería',
        'Bioquímica y Farmacia',
        'Odontología',
        'Nutrición y Dietética',
        'Fisioterapia y Kinesiología',
      ],
      habilidades: [
        'Atención de pacientes',
        'Primeros auxilios',
        'Bioseguridad',
        'Toma de muestras',
        'Farmacología',
      ],
    },
    Educación: {
      profesiones: [
        'Ciencias de la Educación',
        'Profesor de Educación Primaria',
        'Profesor de Educación Secundaria',
        'Psicopedagogía',
      ],
      habilidades: [
        'Planificación curricular',
        'Didáctica',
        'Educación inclusiva',
        'Evaluación del aprendizaje',
      ],
    },
    'Administración, contabilidad y finanzas': {
      profesiones: [
        'Administración de Empresas',
        'Contaduría Pública',
        'Economía',
        'Ingeniería Comercial',
        'Secretariado Ejecutivo',
      ],
      habilidades: [
        'Contabilidad general',
        'Facturación electrónica (SIAT)',
        'Tributación',
        'Planillas y sueldos',
        'Gestión de recursos humanos',
        'Presupuesto público',
        'Contrataciones estatales (SICOES)',
      ],
    },
    'Derecho y ciencias sociales': {
      profesiones: [
        'Derecho',
        'Trabajo Social',
        'Psicología',
        'Comunicación Social',
        'Sociología',
      ],
      habilidades: [
        'Redacción jurídica',
        'Derecho laboral',
        'Procedimiento administrativo',
        'Elaboración de proyectos sociales',
      ],
    },
    'Agropecuaria y medio ambiente': {
      profesiones: [
        'Ingeniería Agronómica',
        'Medicina Veterinaria y Zootecnia',
        'Ingeniería Ambiental',
        'Ingeniería Agroindustrial',
      ],
      habilidades: [
        'Manejo de cultivos',
        'Sanidad animal',
        'Sistemas de riego',
        'Evaluación de impacto ambiental',
        'Gestión de residuos',
      ],
    },
    'Comercio, turismo y gastronomía': {
      profesiones: [
        'Turismo',
        'Gastronomía',
        'Marketing',
        'Comercio Internacional',
      ],
      habilidades: [
        'Ventas',
        'Marketing digital',
        'Manejo de caja',
        'Guía turística',
      ],
    },
    'Oficios técnicos': {
      profesiones: [
        'Técnico en Electricidad Industrial',
        'Técnico en Mecánica Automotriz',
        'Técnico en Soldadura',
      ],
      habilidades: [
        'Soldadura',
        'Mecánica automotriz',
        'Operación de maquinaria pesada',
        'Mantenimiento de maquinaria pesada',
      ],
    },
  };

/** Sirven para cualquier profesión: se sugieren siempre. */
const HABILIDADES_GENERALES = [
  'Microsoft Excel',
  'Microsoft Word',
  'Microsoft PowerPoint',
  'Redacción de informes',
  'Atención al cliente',
  'Trabajo en equipo',
  'Liderazgo',
  'Comunicación efectiva',
  'Gestión del tiempo',
  'Licencia de conducir',
];

/** Se puede ejecutar varias veces: solo crea lo que falta. */
async function seed() {
  await dataSource.initialize();
  const roles = dataSource.getRepository(Role);
  const catalogos = dataSource.getRepository(Catalogo);
  const habilidades = dataSource.getRepository(Habilidad);

  for (const nombre of Object.values(Roles)) {
    if (!(await roles.existsBy({ nombre }))) await roles.save({ nombre });
  }

  const asegurar = async (
    tipo: TipoCatalogo,
    nombre: string,
    parent: Catalogo | null = null,
  ): Promise<Catalogo> =>
    (await catalogos.findOneBy({ tipo, nombre })) ??
    (await catalogos.save(catalogos.create({ tipo, nombre, parent })));

  for (const [tipo, nombres] of Object.entries(CATALOGOS)) {
    for (const nombre of nombres) await asegurar(tipo as TipoCatalogo, nombre);
  }
  for (const nombre of DEPARTAMENTOS) {
    const departamento = await asegurar(TipoCatalogo.Departamento, nombre);
    if (nombre === 'Oruro') {
      for (const municipio of MUNICIPIOS_ORURO) {
        await asegurar(TipoCatalogo.Municipio, municipio, departamento);
      }
    }
  }
  /*
   * Áreas. Los nombres se comparan sin tildes ni mayúsculas, como en el panel
   * de catálogos, para no duplicar "Topografia" y "Topografía". A las filas
   * que ya existían se les asigna área solo la primera vez (cuando aún no hay
   * áreas); después, el área que GADOR elija, incluida "sin área", se respeta.
   */
  const primeraVez = !(await catalogos.existsBy({ tipo: TipoCatalogo.Area }));
  const profesiones = new Map(
    (
      await catalogos.find({
        where: { tipo: TipoCatalogo.Profesion },
        relations: { parent: true },
      })
    ).map((p) => [clave(p.nombre), p]),
  );
  const todasHabilidades = new Map(
    (await habilidades.find({ relations: { area: true } })).map((h) => [
      clave(h.nombre),
      h,
    ]),
  );

  const asegurarProfesion = async (nombre: string, area: Catalogo) => {
    const profesion = profesiones.get(clave(nombre));
    if (!profesion) {
      const nueva = await catalogos.save(
        catalogos.create({
          tipo: TipoCatalogo.Profesion,
          nombre,
          parent: area,
        }),
      );
      profesiones.set(clave(nombre), nueva);
    } else if (primeraVez && !profesion.parent) {
      profesion.parent = area;
      await catalogos.save(profesion);
    }
  };
  const asegurarHabilidad = async (nombre: string, area: Catalogo | null) => {
    const habilidad = todasHabilidades.get(clave(nombre));
    if (!habilidad) {
      const nueva = await habilidades.save(
        habilidades.create({ nombre, area }),
      );
      todasHabilidades.set(clave(nombre), nueva);
    } else if (primeraVez && !habilidad.area && area) {
      habilidad.area = area;
      await habilidades.save(habilidad);
    }
  };

  for (const [nombreArea, contenido] of Object.entries(AREAS)) {
    const area = await asegurar(TipoCatalogo.Area, nombreArea);
    for (const nombre of contenido.profesiones) {
      await asegurarProfesion(nombre, area);
    }
    for (const nombre of contenido.habilidades) {
      await asegurarHabilidad(nombre, area);
    }
  }
  for (const nombre of HABILIDADES_GENERALES) {
    await asegurarHabilidad(nombre, null);
  }

  // Solo el valor inicial: no debe pisar lo que GADOR haya configurado.
  const configuraciones = dataSource.getRepository(Configuracion);
  const limite = 'LIMITE_OFERTAS_ACTIVAS';
  if (!(await configuraciones.existsBy({ clave: limite }))) {
    await configuraciones.save({ clave: limite, valor: '5' });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
  }
  const users = dataSource.getRepository(User);
  if (!(await users.existsBy({ email }))) {
    await users.save(
      users.create({
        nombreCompleto: 'Administrador GADOR',
        email,
        celular: '00000000',
        password: await bcrypt.hash(password, 12),
        phoneVerified: true,
        role: await roles.findOneByOrFail({ nombre: Roles.SuperAdmin }),
      }),
    );
  }

  await dataSource.destroy();
  console.log('Seed completado');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
