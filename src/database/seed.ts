import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { Catalogo } from '../catalogos/entities/catalogo.entity';
import { Configuracion } from '../catalogos/entities/configuracion.entity';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import { Roles, TipoCatalogo } from '../common/enums';
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
  [TipoCatalogo.Profesion]: [
    'Ingeniería de Sistemas',
    'Ingeniería Informática',
    'Ingeniería de Software',
    'Técnico Superior en Sistemas Informáticos',
    'Ingeniería en Redes y Telecomunicaciones',
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

const HABILIDADES = [
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
  for (const nombre of HABILIDADES) {
    if (!(await habilidades.existsBy({ nombre }))) {
      await habilidades.save({ nombre });
    }
  }

  await dataSource
    .getRepository(Configuracion)
    .upsert({ clave: 'LIMITE_OFERTAS_ACTIVAS', valor: '5' }, ['clave']);

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
