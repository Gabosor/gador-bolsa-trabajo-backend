import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';
import dataSource from './data-source';
import { AuditLog } from '../auditoria/entities/audit-log.entity';
import { Catalogo } from '../catalogos/entities/catalogo.entity';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import {
  AccionAudit,
  EstadoEmpresa,
  EstadoOferta,
  EstadoPostulacion,
  Roles,
  TipoCatalogo,
} from '../common/enums';
import { Empresa } from '../empresas/entities/empresa.entity';
import { OfertaHabilidad } from '../ofertas/entities/oferta-habilidad.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { Postulacion } from '../postulaciones/entities/postulacion.entity';
import { calcularMatch } from '../postulaciones/match';
import { calcularCompletitud } from '../postulantes/completitud';
import { Experiencia } from '../postulantes/entities/experiencia.entity';
import { Formacion } from '../postulantes/entities/formacion.entity';
import { PostulanteHabilidad } from '../postulantes/entities/postulante-habilidad.entity';
import { PostulanteProfile } from '../postulantes/entities/postulante-profile.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

/**
 * Datos de ejemplo para la demostración. Todas las personas y empresas son
 * ficticias y los correos usan el dominio reservado example.com.
 * La contraseña se lee de DEMO_PASSWORD; nunca se escribe en el código.
 */
const EMPRESAS = [
  {
    razon: 'Sistemas Uru Digital S.R.L.',
    rubro: 'Tecnología',
    estado: EstadoEmpresa.Aprobada,
  },
  {
    razon: 'Servicios Mineros Pampa Sur S.R.L.',
    rubro: 'Minería',
    estado: EstadoEmpresa.Aprobada,
  },
  {
    razon: 'Comercial Paria Ltda.',
    rubro: 'Comercio',
    estado: EstadoEmpresa.Aprobada,
  },
  {
    razon: 'Clínica Altiplano Sur S.R.L.',
    rubro: 'Salud',
    estado: EstadoEmpresa.Aprobada,
  },
  {
    razon: 'Instituto Técnico Cuatro Vientos',
    rubro: 'Educación',
    estado: EstadoEmpresa.Pendiente,
  },
  {
    razon: 'Constructora Meseta Norte S.A.',
    rubro: 'Construcción',
    estado: EstadoEmpresa.Rechazada,
  },
];

const PROFESIONES = [
  'Ingeniería de Sistemas',
  'Ingeniería Informática',
  'Ingeniería de Software',
  'Técnico Superior en Sistemas Informáticos',
  'Ingeniería en Redes y Telecomunicaciones',
];

const PERSONAS = [
  'Ana Choque Mamani',
  'Luis Flores Quispe',
  'Carla Condori Vargas',
  'Jorge Colque Rojas',
  'María Huanca Torrez',
  'Diego Mamani Ayala',
  'Paola Quispe Salazar',
  'Marco Villca Arce',
  'Sofía Gutiérrez Choque',
  'Rubén Calle Poma',
  'Daniela Ticona Lima',
  'Iván Apaza Rocha',
  'Lucía Mollo Fernández',
  'Óscar Cruz Yucra',
];

/** Grupos de habilidades con nivel; cada postulante recibe uno. */
const PERFILES: [string, number][][] = [
  [
    ['JavaScript', 3],
    ['TypeScript', 2],
    ['Vue.js', 3],
    ['Git', 2],
  ],
  [
    ['PHP', 3],
    ['Laravel', 3],
    ['MySQL', 2],
    ['Git', 2],
  ],
  [
    ['Python', 3],
    ['Django', 2],
    ['PostgreSQL', 2],
    ['Docker', 1],
  ],
  [
    ['Redes', 3],
    ['Linux', 3],
    ['Soporte técnico', 2],
  ],
  [
    ['NestJS', 2],
    ['TypeScript', 3],
    ['PostgreSQL', 3],
    ['Docker', 2],
  ],
  [
    ['Java', 2],
    ['MySQL', 2],
    ['Git', 1],
    ['Linux', 1],
  ],
];

interface OfertaDemo {
  titulo: string;
  empresa: number;
  estado: EstadoOferta;
  profesiones: number[];
  habilidades: [string, boolean, number][];
  contrato: string;
  modalidad: string;
  municipio: string;
  salario: [number, number] | null;
  /** Días transcurridos desde que se creó. */
  antiguedad: number;
}

const OFERTAS: OfertaDemo[] = [
  {
    titulo: 'Desarrollador Full Stack',
    empresa: 0,
    estado: EstadoOferta.Cerrada,
    profesiones: [0, 1, 2],
    habilidades: [
      ['JavaScript', true, 2],
      ['Vue.js', true, 2],
      ['PostgreSQL', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Híbrido',
    municipio: 'Oruro',
    salario: [6000, 9000],
    antiguedad: 170,
  },
  {
    titulo: 'Técnico de Soporte en Campamento',
    empresa: 1,
    estado: EstadoOferta.Cerrada,
    profesiones: [3, 4],
    habilidades: [
      ['Soporte técnico', true, 2],
      ['Redes', true, 1],
      ['Linux', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Huanuni',
    salario: [4000, 5500],
    antiguedad: 135,
  },
  {
    titulo: 'Desarrollador Laravel',
    empresa: 2,
    estado: EstadoOferta.Cerrada,
    profesiones: [0, 2],
    habilidades: [
      ['PHP', true, 2],
      ['Laravel', true, 2],
      ['MySQL', true, 1],
    ],
    contrato: 'Consultoría',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: null,
    antiguedad: 40,
  },
  {
    titulo: 'Administrador de Redes',
    empresa: 1,
    estado: EstadoOferta.EnProceso,
    profesiones: [4, 0],
    habilidades: [
      ['Redes', true, 3],
      ['Linux', true, 2],
      ['Docker', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Presencial',
    municipio: 'Challapata',
    salario: [5500, 7500],
    antiguedad: 75,
  },
  {
    titulo: 'Analista de Datos Clínicos',
    empresa: 3,
    estado: EstadoOferta.EnProceso,
    profesiones: [1, 2],
    habilidades: [
      ['Python', true, 2],
      ['PostgreSQL', true, 2],
      ['Django', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Híbrido',
    municipio: 'Oruro',
    salario: [5000, 7000],
    antiguedad: 28,
  },
  {
    titulo: 'Backend NestJS',
    empresa: 0,
    estado: EstadoOferta.Publicada,
    profesiones: [0, 1, 2],
    habilidades: [
      ['NestJS', true, 2],
      ['TypeScript', true, 2],
      ['Docker', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: [7000, 10000],
    antiguedad: 7,
  },
  {
    titulo: 'Pasante de Desarrollo Web',
    empresa: 2,
    estado: EstadoOferta.Publicada,
    profesiones: [3, 0],
    habilidades: [
      ['JavaScript', true, 1],
      ['Git', false, 1],
    ],
    contrato: 'Pasantía',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [2500, 3000],
    antiguedad: 5,
  },
  {
    titulo: 'Soporte Técnico de Sistemas Hospitalarios',
    empresa: 3,
    estado: EstadoOferta.Publicada,
    profesiones: [3],
    habilidades: [
      ['Soporte técnico', true, 2],
      ['MySQL', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Caracollo',
    salario: null,
    antiguedad: 3,
  },
  {
    titulo: 'Programador Java',
    empresa: 1,
    estado: EstadoOferta.EnRevision,
    profesiones: [0, 1],
    habilidades: [
      ['Java', true, 2],
      ['MySQL', true, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Híbrido',
    municipio: 'Oruro',
    salario: [6000, 8000],
    antiguedad: 1,
  },
  {
    titulo: 'Desarrollador Frontend Vue',
    empresa: 0,
    estado: EstadoOferta.Borrador,
    profesiones: [2],
    habilidades: [['Vue.js', true, 2]],
    contrato: 'Consultoría',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: null,
    antiguedad: 0,
  },
];

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias: number) => new Date(Date.now() - dias * DIA);
const fechaEn = (dias: number) =>
  new Date(Date.now() + dias * DIA).toISOString().slice(0, 10);

/** Estado de la postulación según su lugar en el ranking de MATCH. */
function estadoSegunRanking(estado: EstadoOferta, lugar: number) {
  const {
    Postulado,
    Visto,
    Preseleccionado,
    Entrevista,
    Finalista,
    Contratado,
    Rechazado,
  } = EstadoPostulacion;
  if (estado === EstadoOferta.Cerrada) {
    return [Contratado, Finalista, Rechazado, Rechazado, Rechazado, Rechazado][
      lugar
    ];
  }
  if (estado === EstadoOferta.EnProceso) {
    return [
      Entrevista,
      Preseleccionado,
      Preseleccionado,
      Visto,
      Rechazado,
      Postulado,
    ][lugar];
  }
  return [Visto, Postulado, Postulado, Postulado, Postulado, Postulado][lugar];
}

async function crear(manager: EntityManager, password: string, admin: User) {
  const catalogos = await manager.find(Catalogo);
  const habilidades = await manager.find(Habilidad);
  const catalogo = (tipo: TipoCatalogo, nombre: string) => {
    const item = catalogos.find((c) => c.tipo === tipo && c.nombre === nombre);
    if (!item) throw new Error(`Falta ${nombre}: ejecuta primero npm run seed`);
    return item;
  };
  const habilidad = (nombre: string) => {
    const item = habilidades.find((h) => h.nombre === nombre);
    if (!item) throw new Error(`Falta ${nombre}: ejecuta primero npm run seed`);
    return item;
  };
  const rolDe = (nombre: Roles) => manager.findOneByOrFail(Role, { nombre });
  const auditar = (datos: Partial<AuditLog>) =>
    manager.save(manager.create(AuditLog, { ip: '127.0.0.1', ...datos }));

  const rolEmpresa = await rolDe(Roles.Empresa);
  const empresas: Empresa[] = [];
  for (const [i, datos] of EMPRESAS.entries()) {
    const n = i + 1;
    const user = await manager.save(
      manager.create(User, {
        nombreCompleto: `Representante ${datos.razon}`,
        email: `demo.empresa${n}@example.com`,
        celular: `7100000${n}`,
        password,
        phoneVerified: true,
        role: rolEmpresa,
      }),
    );
    const empresa = await manager.save(
      manager.create(Empresa, {
        user,
        nit: `90000000${n}`,
        razonSocial: datos.razon,
        rubro: catalogo(TipoCatalogo.Rubro, datos.rubro),
        representanteLegal: user.nombreCompleto,
        ciRepresentante: `8000000${n}`,
        celular: user.celular,
        emailCorporativo: user.email,
        direccion: `Calle Bolívar ${100 + n}, Oruro`,
        descripcion: `Empresa ficticia del rubro ${datos.rubro} para la demostración.`,
        estado: datos.estado,
        motivoRechazo:
          datos.estado === EstadoEmpresa.Rechazada
            ? 'El documento NIT no es legible'
            : null,
        createdAt: haceDias(200 - i * 5),
      }),
    );
    empresas.push(empresa);
    if (datos.estado !== EstadoEmpresa.Pendiente) {
      await auditar({
        userId: admin.id,
        accion: AccionAudit.ChangeStatus,
        tablaAfectada: 'empresas',
        registroId: empresa.id,
        datosAnteriores: { estado: EstadoEmpresa.Pendiente },
        datosNuevos: { estado: datos.estado, motivo: empresa.motivoRechazo },
        fecha: haceDias(195 - i * 5),
      });
    }
  }

  const rolPostulante = await rolDe(Roles.Postulante);
  const postulantes: {
    perfil: PostulanteProfile;
    grupo: [string, number][];
  }[] = [];
  for (const [i, nombreCompleto] of PERSONAS.entries()) {
    const n = i + 1;
    const user = await manager.save(
      manager.create(User, {
        nombreCompleto,
        ci: `910000${String(n).padStart(2, '0')}`,
        email: `demo.postulante${n}@example.com`,
        celular: `720000${String(n).padStart(2, '0')}`,
        password,
        phoneVerified: true,
        role: rolPostulante,
      }),
    );
    const grupo = PERFILES[i % PERFILES.length];
    const base = {
      direccion: `Av. 6 de Agosto ${200 + n}, Oruro`,
      fechaNacimiento: `${1990 + (i % 12)}-0${(i % 9) + 1}-15`,
      idiomas: [{ nombre: 'Inglés', nivel: i % 2 ? 'Básico' : 'Intermedio' }],
    };
    const perfil = await manager.save(
      manager.create(PostulanteProfile, {
        user,
        ...base,
        // Sin foto ni CV: los archivos reales solo existen en R2.
        porcentajeCompletitud: calcularCompletitud({
          direccion: base.direccion,
          fechaNacimiento: base.fechaNacimiento,
          fotoKey: null,
          cvKey: null,
          idiomas: 1,
          formaciones: 1,
          experiencias: 1,
          habilidades: grupo.length,
        }),
      }),
    );
    await manager.save(
      manager.create(Formacion, {
        profile: perfil,
        profesion: catalogo(
          TipoCatalogo.Profesion,
          PROFESIONES[i % PROFESIONES.length],
        ),
        institucion:
          i % 3
            ? 'Universidad Técnica de Oruro'
            : 'Instituto Técnico Superior de Oruro',
        anioTitulacion: 2012 + (i % 12),
        nroTituloNacional: `DEMO-${1000 + n}`,
      }),
    );
    await manager.save(
      manager.create(Experiencia, {
        profile: perfil,
        empresa: 'Empresa de ejemplo',
        cargo: 'Técnico en sistemas',
        anios: (i % 6) + 1,
        descripcion: 'Desarrollo y mantenimiento de sistemas internos.',
      }),
    );
    for (const [nombre, nivel] of grupo) {
      await manager.save(
        manager.create(PostulanteHabilidad, {
          profile: perfil,
          habilidad: habilidad(nombre),
          nivel,
        }),
      );
    }
    postulantes.push({ perfil, grupo });
  }

  for (const [i, datos] of OFERTAS.entries()) {
    const empresa = empresas[datos.empresa];
    const creada = haceDias(datos.antiguedad);
    const vigente = [
      EstadoOferta.Publicada,
      EstadoOferta.EnProceso,
      EstadoOferta.EnRevision,
      EstadoOferta.Borrador,
    ].includes(datos.estado);
    const oferta = await manager.save(
      manager.create(Oferta, {
        empresa,
        titulo: datos.titulo,
        descripcion: `${datos.titulo} para ${empresa.razonSocial}. Oferta ficticia de demostración.`,
        requisitosObligatorios:
          'Título profesional y experiencia comprobable en el área.',
        requisitosDeseables: 'Disponibilidad inmediata.',
        profesiones: datos.profesiones.map((p) =>
          catalogo(TipoCatalogo.Profesion, PROFESIONES[p]),
        ),
        aniosExperiencia: i % 4,
        tipoContrato: catalogo(TipoCatalogo.TipoContrato, datos.contrato),
        modalidad: catalogo(TipoCatalogo.Modalidad, datos.modalidad),
        municipio: catalogo(TipoCatalogo.Municipio, datos.municipio),
        salarioMin: datos.salario?.[0] ?? null,
        salarioMax: datos.salario?.[1] ?? null,
        salarioATratar: datos.salario === null,
        beneficios: 'Seguro de salud y aguinaldo.',
        fechaCierre: vigente
          ? fechaEn(20 + i)
          : fechaEn(-(datos.antiguedad - 30)),
        numeroPlazas: 1,
        estado: datos.estado,
        totalVistas: datos.estado === EstadoOferta.Borrador ? 0 : 25 + i * 13,
        createdAt: creada,
      }),
    );
    for (const [nombre, obligatoria, nivelMinimo] of datos.habilidades) {
      await manager.save(
        manager.create(OfertaHabilidad, {
          oferta,
          habilidad: habilidad(nombre),
          obligatoria,
          nivelMinimo,
        }),
      );
    }

    const publicada = [
      EstadoOferta.Publicada,
      EstadoOferta.EnProceso,
      EstadoOferta.Cerrada,
    ].includes(datos.estado);
    if (!publicada) continue;
    await auditar({
      userId: admin.id,
      accion: AccionAudit.ChangeStatus,
      tablaAfectada: 'ofertas',
      registroId: oferta.id,
      datosAnteriores: { estado: EstadoOferta.EnRevision },
      datosNuevos: { estado: EstadoOferta.Publicada },
      fecha: creada,
    });
    if (datos.estado === EstadoOferta.Cerrada) {
      await auditar({
        userId: empresa.user.id,
        accion: AccionAudit.ChangeStatus,
        tablaAfectada: 'ofertas',
        registroId: oferta.id,
        datosAnteriores: { estado: EstadoOferta.EnProceso },
        datosNuevos: { estado: EstadoOferta.Cerrada },
        fecha: haceDias(Math.max(datos.antiguedad - 35, 1)),
      });
    }

    const requeridas = datos.habilidades.map(
      ([nombre, obligatoria, nivelMinimo]) => ({
        habilidadId: habilidad(nombre).id,
        obligatoria,
        nivelMinimo,
      }),
    );
    const candidatos = Array.from(
      { length: 6 },
      (_, j) => postulantes[(i * 3 + j) % postulantes.length],
    )
      .map(({ perfil, grupo }) => ({
        perfil,
        match: calcularMatch(
          grupo.map(([nombre, nivel]) => ({
            habilidadId: habilidad(nombre).id,
            nivel,
          })),
          requeridas,
        ),
      }))
      .sort((a, b) => b.match - a.match);
    for (const [lugar, { perfil, match }] of candidatos.entries()) {
      await manager.save(
        manager.create(Postulacion, {
          oferta,
          postulante: perfil,
          porcentajeMatch: match,
          estado: estadoSegunRanking(datos.estado, lugar),
          createdAt: haceDias(Math.max(datos.antiguedad - lugar * 2, 0)),
        }),
      );
    }
  }
}

async function seedDemo() {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) throw new Error('Define DEMO_PASSWORD en el archivo .env');
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  if (await users.existsBy({ email: 'demo.empresa1@example.com' })) {
    console.log('Los datos de ejemplo ya existen; no se hizo ningún cambio');
    await dataSource.destroy();
    return;
  }
  const admin = await users.findOne({
    where: { role: { nombre: Roles.SuperAdmin } },
  });
  if (!admin) throw new Error('Ejecuta primero npm run seed');
  const password = await bcrypt.hash(demoPassword, 12);
  await dataSource.transaction((manager) => crear(manager, password, admin));
  await dataSource.destroy();
  console.log('Datos de ejemplo creados');
}

seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
