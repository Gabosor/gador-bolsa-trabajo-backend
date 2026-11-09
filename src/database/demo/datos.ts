import { EstadoEmpresa, EstadoOferta } from '../../common/enums';
import type { Figura } from './archivos';

/**
 * Datos de ejemplo. Todas las personas y empresas son ficticias y los
 * correos usan el dominio reservado example.com. Los nombres de catálogo
 * deben existir en seed.ts: si falta uno, el seeder avisa.
 *
 * El "grupo" une ofertas y postulantes del mismo campo, para que las
 * postulaciones tengan un MATCH con sentido.
 */
export type Grupo = 'civil' | 'salud' | 'conta' | 'ti' | 'mineria' | 'comercio';

export interface EmpresaDemo {
  razon: string;
  rubro: string;
  estado: EstadoEmpresa;
  motivo?: string;
  logo?: { color: string; figura: Figura };
  descripcion: string;
}

export interface PersonaDemo {
  nombre: string;
  grupo: Grupo;
  profesion: string;
  institucion: string;
  habilidades: [string, number][];
  cargo: string;
  empresaAnterior: string;
  anios: number;
  experiencia: string;
  cv: boolean;
}

export interface OfertaDemo {
  titulo: string;
  empresa: number;
  grupo: Grupo;
  estado: EstadoOferta;
  profesiones: string[];
  /** [habilidad, obligatoria, nivel mínimo] */
  habilidades: [string, boolean, number][];
  contrato: string;
  modalidad: string;
  municipio: string;
  salario: [number, number] | null;
  experiencia: number;
  /** Días transcurridos desde que se creó. */
  antiguedad: number;
  descripcion: string;
  requisitos: string[];
  deseables?: string[];
  beneficios?: string[];
  /** Texto como se guardaba antes del editor, para probar la compatibilidad. */
  textoPlano?: boolean;
}

export const EMPRESAS: EmpresaDemo[] = [
  {
    razon: 'Sistemas Uru Digital S.R.L.',
    rubro: 'Tecnología',
    estado: EstadoEmpresa.Aprobada,
    logo: { color: '#1d4ed8', figura: 'circulo' },
    descripcion:
      'Desarrollamos sistemas a medida para empresas e instituciones de Oruro.\n\nTrabajamos con **equipos pequeños** y metodologías ágiles.',
  },
  {
    razon: 'Servicios Mineros Pampa Sur S.R.L.',
    rubro: 'Minería',
    estado: EstadoEmpresa.Aprobada,
    logo: { color: '#b45309', figura: 'montana' },
    descripcion:
      'Prestamos servicios de operación y seguridad a cooperativas y empresas mineras de Huanuni y Poopó.\n\nLa **seguridad del trabajador** es nuestra primera regla.',
  },
  {
    razon: 'Comercial Paria Ltda.',
    rubro: 'Comercio',
    estado: EstadoEmpresa.Aprobada,
    descripcion:
      'Cadena de tiendas de abarrotes y artículos de hogar con cuatro sucursales en la ciudad de Oruro.',
  },
  {
    razon: 'Clínica Altiplano Sur S.R.L.',
    rubro: 'Salud',
    estado: EstadoEmpresa.Aprobada,
    logo: { color: '#b91c1c', figura: 'cruz' },
    descripcion:
      'Clínica de segundo nivel con internación, emergencias las 24 horas y laboratorio propio.\n\nBuscamos personal con **vocación de servicio**.',
  },
  {
    razon: 'Constructora Meseta Norte S.A.',
    rubro: 'Construcción',
    estado: EstadoEmpresa.Aprobada,
    logo: { color: '#c2410c', figura: 'edificio' },
    descripcion:
      'Ejecutamos obras civiles, viviendas y caminos vecinales en el departamento de Oruro.\n\nMás de **15 años** construyendo con empresas y municipios.',
  },
  {
    razon: 'Estudio Contable Sora Sora S.R.L.',
    rubro: 'Servicios',
    estado: EstadoEmpresa.Aprobada,
    logo: { color: '#15803d', figura: 'grafico' },
    descripcion:
      'Contabilidad, impuestos y planillas para pequeñas y medianas empresas.\n\nAtendemos a **más de 120 clientes** en Oruro y provincias.',
  },
  {
    razon: 'Ingeniería y Topografía Sajama S.R.L.',
    rubro: 'Construcción',
    estado: EstadoEmpresa.Pendiente,
    logo: { color: '#0f766e', figura: 'engranaje' },
    descripcion:
      'Estudios topográficos, diseño de caminos y supervisión técnica de obras.\n\nContamos con **estaciones totales y drones** propios.',
  },
  {
    razon: 'Centro de Salud Integral Thunupa',
    rubro: 'Salud',
    estado: EstadoEmpresa.Pendiente,
    logo: { color: '#be185d', figura: 'circulo' },
    descripcion:
      'Centro de atención primaria con consultorios, vacunación y enfermería a domicilio.',
  },
  {
    razon: 'Cooperativa de Ahorro San Felipe Ltda.',
    rubro: 'Servicios',
    estado: EstadoEmpresa.Pendiente,
    logo: { color: '#047857', figura: 'grafico' },
    descripcion:
      'Cooperativa de ahorro y crédito con 30 años de servicio a socios de Oruro.\n\nOfrecemos **créditos productivos** y de vivienda.',
  },
  {
    razon: 'Instituto Técnico Cuatro Vientos',
    rubro: 'Educación',
    estado: EstadoEmpresa.Pendiente,
    logo: { color: '#7c3aed', figura: 'libro' },
    descripcion:
      'Formación técnica en mecánica, electricidad y contabilidad, con convenios para pasantías.',
  },
  {
    razon: 'Transportes Uyuni Express',
    rubro: 'Servicios',
    estado: EstadoEmpresa.Rechazada,
    motivo: 'El documento NIT no es legible y el respaldo legal está vencido.',
    descripcion: 'Transporte interdepartamental de carga.',
  },
  {
    razon: 'Distribuidora El Pagador S.R.L.',
    rubro: 'Comercio',
    estado: EstadoEmpresa.Suspendida,
    motivo:
      'Denuncias de postulantes por ofertas que no correspondían al cargo.',
    descripcion: 'Distribución de bebidas y productos de consumo masivo.',
  },
];

const UTO = 'Universidad Técnica de Oruro';

export const PERSONAS: PersonaDemo[] = [
  // Ingeniería civil y construcción
  {
    nombre: 'Rodrigo Mamani Choque',
    grupo: 'civil',
    profesion: 'Ingeniería Civil',
    institucion: UTO,
    habilidades: [
      ['Supervisión de obras', 3],
      ['Cómputos métricos y presupuestos de obra', 3],
      ['AutoCAD', 2],
      ['Licencia de conducir', 2],
    ],
    cargo: 'Residente de obra',
    empresaAnterior: 'Gobierno Autónomo Municipal de Caracollo',
    anios: 6,
    experiencia:
      'Responsable de la ejecución de obras de infraestructura municipal.\n- Dirección de cuadrillas de hasta **25 personas**\n- Control de avance y planillas de pago\n- Elaboración de informes mensuales',
    cv: true,
  },
  {
    nombre: 'Valeria Condori Flores',
    grupo: 'civil',
    profesion: 'Ingeniería Civil',
    institucion: UTO,
    habilidades: [
      ['Civil 3D', 3],
      ['AutoCAD', 3],
      ['Lectura de planos', 3],
      ['Supervisión de obras', 1],
    ],
    cargo: 'Proyectista vial',
    empresaAnterior: 'Consultora Andina de Caminos',
    anios: 3,
    experiencia:
      'Diseño geométrico de caminos vecinales.\n- Modelado en **Civil 3D**\n- Cómputos de movimiento de tierras',
    cv: true,
  },
  {
    nombre: 'Germán Quispe Arias',
    grupo: 'civil',
    profesion: 'Técnico Superior en Topografía y Geodesia',
    institucion: 'Instituto Tecnológico Oruro',
    habilidades: [
      ['Topografía', 3],
      ['Manejo de estación total', 3],
      ['Civil 3D', 1],
    ],
    cargo: 'Topógrafo',
    empresaAnterior: 'Empresa Constructora Sajama',
    anios: 8,
    experiencia:
      'Levantamientos topográficos y replanteo de obras.\n1. Levantamiento con estación total\n2. Nivelación geométrica\n3. Procesamiento de datos',
    cv: true,
  },
  {
    nombre: 'Natalia Villca Rojas',
    grupo: 'civil',
    profesion: 'Ingeniería Civil',
    institucion: UTO,
    habilidades: [
      ['Lectura de planos', 2],
      ['Revit', 2],
      ['Microsoft Excel', 3],
    ],
    cargo: 'Asistente técnica',
    empresaAnterior: 'Constructora Altiplánica',
    anios: 1,
    experiencia:
      'Apoyo en planillas de avance y control de materiales en obra.',
    cv: false,
  },
  // Salud
  {
    nombre: 'Patricia Huanca Mollo',
    grupo: 'salud',
    profesion: 'Enfermería',
    institucion: UTO,
    habilidades: [
      ['Atención de pacientes', 3],
      ['Bioseguridad', 3],
      ['Primeros auxilios', 3],
      ['Trabajo en equipo', 2],
    ],
    cargo: 'Licenciada en enfermería',
    empresaAnterior: 'Hospital General San Juan de Dios',
    anios: 7,
    experiencia:
      'Enfermería en sala de internación y emergencias.\n- Administración de medicamentos\n- Control de signos vitales\n- **Coordinación de turno** nocturno',
    cv: true,
  },
  {
    nombre: 'Javier Colque Mendoza',
    grupo: 'salud',
    profesion: 'Enfermería',
    institucion: 'Universidad Privada de Oruro',
    habilidades: [
      ['Atención de pacientes', 2],
      ['Toma de muestras', 2],
      ['Bioseguridad', 2],
    ],
    cargo: 'Enfermero',
    empresaAnterior: 'Caja Nacional de Salud',
    anios: 3,
    experiencia:
      'Atención en consulta externa y campañas de vacunación.\n- Toma de muestras\n- Registro en el sistema de vacunas',
    cv: true,
  },
  {
    nombre: 'Mónica Ticona Poma',
    grupo: 'salud',
    profesion: 'Enfermería',
    institucion: UTO,
    habilidades: [
      ['Primeros auxilios', 2],
      ['Atención de pacientes', 1],
    ],
    cargo: 'Auxiliar de enfermería',
    empresaAnterior: 'Centro de Salud Vinto',
    anios: 1,
    experiencia: 'Apoyo en curaciones y atención a pacientes ambulatorios.',
    cv: false,
  },
  {
    nombre: 'Esteban Gutiérrez Lima',
    grupo: 'salud',
    profesion: 'Bioquímica y Farmacia',
    institucion: UTO,
    habilidades: [
      ['Farmacología', 3],
      ['Toma de muestras', 3],
      ['Atención al cliente', 2],
    ],
    cargo: 'Regente de farmacia',
    empresaAnterior: 'Farmacias Bolivia',
    anios: 4,
    experiencia:
      'Dispensación de medicamentos y control de inventario.\n- Control de **medicamentos controlados**\n- Atención al público',
    cv: true,
  },
  // Contaduría
  {
    nombre: 'Claudia Apaza Vargas',
    grupo: 'conta',
    profesion: 'Contaduría Pública',
    institucion: UTO,
    habilidades: [
      ['Contabilidad general', 3],
      ['Facturación electrónica (SIAT)', 3],
      ['Tributación', 3],
      ['Microsoft Excel', 3],
    ],
    cargo: 'Contadora general',
    empresaAnterior: 'Importadora del Sur',
    anios: 9,
    experiencia:
      'Responsable de la contabilidad y los impuestos de la empresa.\n- Declaraciones mensuales al SIN\n- Estados financieros anuales\n- **Cierre de gestión** sin observaciones',
    cv: true,
  },
  {
    nombre: 'Fernando Calle Rocha',
    grupo: 'conta',
    profesion: 'Contaduría Pública',
    institucion: 'Universidad Privada de Oruro',
    habilidades: [
      ['Contabilidad general', 2],
      ['Planillas y sueldos', 3],
      ['Microsoft Excel', 2],
    ],
    cargo: 'Auxiliar contable',
    empresaAnterior: 'Estudio Contable Pagador',
    anios: 2,
    experiencia:
      'Elaboración de planillas de sueldos y aportes.\n1. Planillas mensuales\n2. Aportes a la gestora\n3. Finiquitos',
    cv: true,
  },
  {
    nombre: 'Gabriela Torrez Salazar',
    grupo: 'conta',
    profesion: 'Contaduría Pública',
    institucion: UTO,
    habilidades: [
      ['Contrataciones estatales (SICOES)', 3],
      ['Presupuesto público', 2],
      ['Redacción de informes', 2],
    ],
    cargo: 'Técnica de contrataciones',
    empresaAnterior: 'Gobierno Autónomo Departamental',
    anios: 5,
    experiencia:
      'Procesos de contratación bajo la normativa **SABS**.\n- Publicación en SICOES\n- Elaboración de DBC',
    cv: true,
  },
  {
    nombre: 'Andrés Yucra Fernández',
    grupo: 'conta',
    profesion: 'Economía',
    institucion: UTO,
    habilidades: [
      ['Presupuesto público', 2],
      ['Microsoft Excel', 3],
    ],
    cargo: 'Analista de presupuesto',
    empresaAnterior: 'Municipio de Challapata',
    anios: 2,
    experiencia: 'Seguimiento a la ejecución presupuestaria municipal.',
    cv: false,
  },
  // Tecnologías de la información
  {
    nombre: 'Ana Choque Mamani',
    grupo: 'ti',
    profesion: 'Ingeniería de Sistemas',
    institucion: UTO,
    habilidades: [
      ['NestJS', 3],
      ['TypeScript', 3],
      ['PostgreSQL', 2],
      ['Docker', 2],
    ],
    cargo: 'Desarrolladora backend',
    empresaAnterior: 'Software Andino',
    anios: 4,
    experiencia:
      'Desarrollo de APIs para sistemas de gestión.\n- **NestJS** y PostgreSQL\n- Despliegues con Docker',
    cv: true,
  },
  {
    nombre: 'Luis Flores Quispe',
    grupo: 'ti',
    profesion: 'Ingeniería Informática',
    institucion: UTO,
    habilidades: [
      ['PHP', 3],
      ['Laravel', 3],
      ['MySQL', 2],
      ['Git', 2],
    ],
    cargo: 'Desarrollador web',
    empresaAnterior: 'Agencia Digital Oruro',
    anios: 5,
    experiencia: 'Desarrollo de sitios y sistemas con Laravel.',
    cv: true,
  },
  {
    nombre: 'Carla Condori Vargas',
    grupo: 'ti',
    profesion: 'Ingeniería de Software',
    institucion: 'Universidad Privada de Oruro',
    habilidades: [
      ['JavaScript', 3],
      ['Vue.js', 3],
      ['TypeScript', 2],
      ['Git', 2],
    ],
    cargo: 'Desarrolladora frontend',
    empresaAnterior: 'Sistemas del Altiplano',
    anios: 3,
    experiencia:
      'Interfaces web con Vue.\n- Componentes accesibles\n- Pruebas unitarias',
    cv: false,
  },
  {
    nombre: 'Jorge Colque Rojas',
    grupo: 'ti',
    profesion: 'Técnico Superior en Sistemas Informáticos',
    institucion: 'Instituto Tecnológico Oruro',
    habilidades: [
      ['Redes', 2],
      ['Linux', 2],
      ['Soporte técnico', 3],
    ],
    cargo: 'Técnico de soporte',
    empresaAnterior: 'Cooperativa de Teléfonos',
    anios: 6,
    experiencia: 'Soporte a usuarios y mantenimiento de equipos.',
    cv: false,
  },
  // Minería
  {
    nombre: 'Marco Villca Arce',
    grupo: 'mineria',
    profesion: 'Ingeniería de Minas',
    institucion: UTO,
    habilidades: [
      ['Seguridad e higiene minera', 3],
      ['Planificación minera', 2],
      ['Ventilación de minas', 2],
    ],
    cargo: 'Jefe de seguridad',
    empresaAnterior: 'Cooperativa Minera Huanuni',
    anios: 8,
    experiencia:
      'Responsable del plan de seguridad en interior mina.\n- Capacitaciones semanales\n- **Cero accidentes** en 2024',
    cv: true,
  },
  {
    nombre: 'Rubén Calle Poma',
    grupo: 'mineria',
    profesion: 'Técnico Superior en Minería',
    institucion: 'Instituto Tecnológico Oruro',
    habilidades: [
      ['Perforación y voladura', 3],
      ['Seguridad e higiene minera', 2],
      ['Primeros auxilios', 2],
    ],
    cargo: 'Capataz',
    empresaAnterior: 'Minera San José',
    anios: 5,
    experiencia: 'Supervisión de cuadrillas de perforación.',
    cv: false,
  },
  // Comercio
  {
    nombre: 'Lucía Mollo Fernández',
    grupo: 'comercio',
    profesion: 'Ingeniería Comercial',
    institucion: UTO,
    habilidades: [
      ['Ventas', 3],
      ['Manejo de caja', 2],
      ['Atención al cliente', 3],
    ],
    cargo: 'Encargada de tienda',
    empresaAnterior: 'Supermercado Oruro',
    anios: 4,
    experiencia: 'Manejo de caja, inventario y atención al cliente.',
    cv: false,
  },
  {
    nombre: 'Óscar Cruz Yucra',
    grupo: 'comercio',
    profesion: 'Marketing',
    institucion: 'Universidad Privada de Oruro',
    habilidades: [
      ['Marketing digital', 3],
      ['Ventas', 2],
      ['Licencia de conducir', 2],
    ],
    cargo: 'Vendedor',
    empresaAnterior: 'Distribuidora Andina',
    anios: 2,
    experiencia: 'Ventas de ruta y redes sociales de la empresa.',
    cv: false,
  },
];

const BENEFICIOS_LEY = [
  'Seguro de salud a corto plazo',
  'Aguinaldo y vacaciones según ley',
];

export const OFERTAS: OfertaDemo[] = [
  // Ingeniería civil (Constructora Meseta Norte)
  {
    titulo: 'Ingeniero Civil Residente de Obra',
    empresa: 4,
    grupo: 'civil',
    estado: EstadoOferta.Publicada,
    profesiones: ['Ingeniería Civil'],
    habilidades: [
      ['Supervisión de obras', true, 2],
      ['Cómputos métricos y presupuestos de obra', true, 2],
      ['AutoCAD', true, 1],
      ['Licencia de conducir', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [8000, 11000],
    experiencia: 3,
    antiguedad: 6,
    descripcion:
      'Buscamos un ingeniero civil para dirigir la construcción de una **unidad educativa de dos plantas** en la zona norte de Oruro.\n\nSerás el responsable técnico en obra, coordinando con la supervisión y el municipio.',
    requisitos: [
      'Título en provisión nacional de **Ingeniería Civil**',
      'Registro vigente en la SIB',
      'Al menos 3 años como residente de obra',
    ],
    deseables: ['Experiencia en obras públicas', 'Manejo de Project'],
    beneficios: [
      ...BENEFICIOS_LEY,
      'Movilidad a obra',
      'Bono por cumplimiento de plazos',
    ],
  },
  {
    titulo: 'Topógrafo para Proyecto Vial',
    empresa: 4,
    grupo: 'civil',
    estado: EstadoOferta.EnProceso,
    profesiones: [
      'Técnico Superior en Topografía y Geodesia',
      'Ingeniería Civil',
    ],
    habilidades: [
      ['Topografía', true, 3],
      ['Manejo de estación total', true, 2],
      ['Civil 3D', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Caracollo',
    salario: [5000, 6500],
    experiencia: 2,
    antiguedad: 30,
    descripcion:
      'Levantamiento y replanteo para el mejoramiento del camino **Caracollo – Colquiri** (24 km).\n\nTrabajo en campo de lunes a sábado.',
    requisitos: [
      'Título de técnico superior en topografía o ingeniería civil',
      'Manejo de estación total y GPS diferencial',
    ],
    beneficios: [...BENEFICIOS_LEY, 'Viáticos en campo'],
  },
  {
    titulo: 'Supervisor de Obras Civiles',
    empresa: 4,
    grupo: 'civil',
    estado: EstadoOferta.EnRevision,
    profesiones: ['Ingeniería Civil', 'Arquitectura'],
    habilidades: [
      ['Supervisión de obras', true, 2],
      ['Lectura de planos', true, 2],
      ['Redacción de informes', false, 1],
    ],
    contrato: 'Consultoría',
    modalidad: 'Presencial',
    municipio: 'Challapata',
    salario: null,
    experiencia: 4,
    antiguedad: 1,
    descripcion:
      'Supervisión técnica de **tres obras de saneamiento básico** financiadas por el municipio.\n\nIncluye informes quincenales al fiscal de obra.',
    requisitos: [
      'Ingeniero civil o arquitecto con registro profesional',
      'Experiencia mínima de 4 años en supervisión',
      'Disponibilidad para viajar',
    ],
  },
  // Salud (Clínica Altiplano Sur)
  {
    titulo: 'Licenciada/o en Enfermería – Turno Noche',
    empresa: 3,
    grupo: 'salud',
    estado: EstadoOferta.Publicada,
    profesiones: ['Enfermería'],
    habilidades: [
      ['Atención de pacientes', true, 3],
      ['Bioseguridad', true, 2],
      ['Primeros auxilios', true, 2],
      ['Trabajo en equipo', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [5500, 7000],
    experiencia: 2,
    antiguedad: 4,
    descripcion:
      'Requerimos licenciada/o en enfermería para la **sala de internación** en turno de noche (rotativo).\n\nTrabajarás junto a un equipo de médicos residentes y auxiliares.',
    requisitos: [
      'Título de **Licenciatura en Enfermería**',
      'Matrícula profesional vigente',
      'Carnet de vacunas al día',
    ],
    deseables: ['Curso de RCP avanzado'],
    beneficios: [...BENEFICIOS_LEY, 'Bono nocturno', 'Alimentación en turno'],
  },
  {
    titulo: 'Enfermera/o para Campaña de Vacunación',
    empresa: 3,
    grupo: 'salud',
    estado: EstadoOferta.Cerrada,
    profesiones: ['Enfermería'],
    habilidades: [
      ['Atención de pacientes', true, 2],
      ['Toma de muestras', false, 1],
      ['Bioseguridad', true, 2],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Huanuni',
    salario: [4500, 5000],
    experiencia: 1,
    antiguedad: 120,
    descripcion:
      'Campaña de vacunación de **tres meses** en las comunidades de Huanuni.',
    requisitos: ['Título en enfermería', 'Disponibilidad para viajar'],
    beneficios: ['Viáticos', 'Transporte'],
  },
  {
    titulo: 'Auxiliar de Farmacia',
    empresa: 3,
    grupo: 'salud',
    estado: EstadoOferta.EnRevision,
    profesiones: ['Bioquímica y Farmacia', 'Enfermería'],
    habilidades: [
      ['Farmacología', true, 2],
      ['Atención al cliente', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: null,
    experiencia: 1,
    antiguedad: 2,
    descripcion:
      'Apoyo en la **farmacia interna** de la clínica: dispensación y control de stock.',
    requisitos: [
      'Estudios en bioquímica y farmacia o enfermería',
      'Conocimiento de medicamentos de uso común',
    ],
  },
  // Contaduría (Estudio Contable Sora Sora)
  {
    titulo: 'Contador General',
    empresa: 5,
    grupo: 'conta',
    estado: EstadoOferta.Publicada,
    profesiones: ['Contaduría Pública'],
    habilidades: [
      ['Contabilidad general', true, 3],
      ['Facturación electrónica (SIAT)', true, 2],
      ['Tributación', true, 2],
      ['Microsoft Excel', false, 2],
    ],
    contrato: 'Indefinido',
    modalidad: 'Híbrido',
    municipio: 'Oruro',
    salario: [7000, 9000],
    experiencia: 4,
    antiguedad: 8,
    descripcion:
      'Llevarás la contabilidad de una cartera de **15 clientes** (comercio y servicios).\n\nTrabajo híbrido: tres días en oficina y dos desde casa.',
    requisitos: [
      'Título de **Contaduría Pública** con registro en el colegio',
      'Manejo de SIAT en línea',
      'Experiencia en cierres de gestión',
    ],
    deseables: ['Conocimiento de NIIF'],
    beneficios: [...BENEFICIOS_LEY, 'Capacitación tributaria anual'],
  },
  {
    titulo: 'Asistente Contable',
    empresa: 5,
    grupo: 'conta',
    estado: EstadoOferta.EnProceso,
    profesiones: ['Contaduría Pública', 'Administración de Empresas'],
    habilidades: [
      ['Contabilidad general', true, 2],
      ['Planillas y sueldos', true, 1],
      ['Microsoft Excel', false, 2],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [3500, 4500],
    experiencia: 1,
    antiguedad: 25,
    descripcion:
      'Apoyo en registros contables, planillas y archivo.\n\nIdeal para **recién titulados** con ganas de aprender.',
    requisitos: [
      'Egresado o titulado en contaduría o administración',
      'Manejo de Excel intermedio',
    ],
    beneficios: [...BENEFICIOS_LEY],
  },
  {
    titulo: 'Analista de Contrataciones Estatales',
    empresa: 5,
    grupo: 'conta',
    estado: EstadoOferta.EnRevision,
    profesiones: ['Contaduría Pública', 'Economía'],
    habilidades: [
      ['Contrataciones estatales (SICOES)', true, 2],
      ['Presupuesto público', true, 1],
      ['Redacción de informes', false, 1],
    ],
    contrato: 'Consultoría',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: [6000, 7500],
    experiencia: 3,
    antiguedad: 1,
    descripcion:
      'Preparación de propuestas para **licitaciones públicas** de nuestros clientes.',
    requisitos: [
      'Conocimiento de las normas básicas del SABS',
      'Experiencia en SICOES',
    ],
  },
  // Tecnologías de la información
  {
    titulo: 'Backend NestJS',
    empresa: 0,
    grupo: 'ti',
    estado: EstadoOferta.Publicada,
    profesiones: [
      'Ingeniería de Sistemas',
      'Ingeniería Informática',
      'Ingeniería de Software',
    ],
    habilidades: [
      ['NestJS', true, 2],
      ['TypeScript', true, 2],
      ['Docker', false, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: [7000, 10000],
    experiencia: 2,
    antiguedad: 7,
    descripcion:
      'Desarrollo de APIs para un sistema de gestión hospitalaria.\n\nTrabajarás con **NestJS, PostgreSQL y Docker**.',
    requisitos: [
      '2 años con Node.js',
      'Experiencia con bases de datos relacionales',
    ],
    beneficios: [...BENEFICIOS_LEY, 'Trabajo 100 % remoto', 'Equipo portátil'],
  },
  {
    titulo: 'Desarrollador Laravel',
    empresa: 2,
    grupo: 'ti',
    estado: EstadoOferta.Cerrada,
    profesiones: ['Ingeniería de Sistemas', 'Ingeniería de Software'],
    habilidades: [
      ['PHP', true, 2],
      ['Laravel', true, 2],
      ['MySQL', true, 1],
    ],
    contrato: 'Consultoría',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: null,
    experiencia: 2,
    antiguedad: 40,
    descripcion:
      'Desarrollo del sistema de inventarios de nuestras sucursales. Oferta publicada antes del editor con formato.',
    requisitos: ['Título profesional y experiencia comprobable en el área.'],
    beneficios: ['Seguro de salud y aguinaldo.'],
    textoPlano: true,
  },
  {
    titulo: 'Desarrollador Frontend Vue',
    empresa: 0,
    grupo: 'ti',
    estado: EstadoOferta.Borrador,
    profesiones: ['Ingeniería de Software'],
    habilidades: [['Vue.js', true, 2]],
    contrato: 'Consultoría',
    modalidad: 'Remoto',
    municipio: 'Oruro',
    salario: null,
    experiencia: 1,
    antiguedad: 0,
    descripcion: 'Borrador: interfaz del nuevo portal de clientes.',
    requisitos: ['Experiencia con Vue 3'],
  },
  // Minería
  {
    titulo: 'Técnico en Seguridad Minera',
    empresa: 1,
    grupo: 'mineria',
    estado: EstadoOferta.Publicada,
    profesiones: ['Ingeniería de Minas', 'Técnico Superior en Minería'],
    habilidades: [
      ['Seguridad e higiene minera', true, 3],
      ['Ventilación de minas', false, 1],
      ['Primeros auxilios', true, 1],
    ],
    contrato: 'Indefinido',
    modalidad: 'Presencial',
    municipio: 'Huanuni',
    salario: [6000, 8000],
    experiencia: 3,
    antiguedad: 10,
    descripcion:
      'Responsable de inspecciones y capacitaciones de seguridad en **interior mina**.',
    requisitos: [
      'Título en ingeniería de minas o técnico en minería',
      'Curso de seguridad industrial',
    ],
    beneficios: [
      ...BENEFICIOS_LEY,
      'Bono de riesgo',
      'Campamento y alimentación',
    ],
  },
  {
    titulo: 'Ingeniero de Planificación Minera',
    empresa: 1,
    grupo: 'mineria',
    estado: EstadoOferta.EnProceso,
    profesiones: ['Ingeniería de Minas'],
    habilidades: [
      ['Planificación minera', true, 2],
      ['AutoCAD', false, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Híbrido',
    municipio: 'Huanuni',
    salario: [8000, 10000],
    experiencia: 4,
    antiguedad: 35,
    descripcion: 'Planificación de corto y mediano plazo de la operación.',
    requisitos: ['Título de ingeniería de minas', 'Manejo de software minero'],
  },
  // Comercio
  {
    titulo: 'Cajero/a de Sucursal',
    empresa: 2,
    grupo: 'comercio',
    estado: EstadoOferta.Publicada,
    profesiones: ['Ingeniería Comercial', 'Administración de Empresas'],
    habilidades: [
      ['Manejo de caja', true, 2],
      ['Atención al cliente', true, 2],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [2800, 3200],
    experiencia: 0,
    antiguedad: 3,
    descripcion:
      'Atención en caja en la **sucursal de la avenida 6 de Agosto**.',
    requisitos: ['Bachiller o estudiante universitario', 'Experiencia en caja'],
    beneficios: [...BENEFICIOS_LEY],
  },
  {
    titulo: 'Vendedor de Ruta',
    empresa: 11,
    grupo: 'comercio',
    estado: EstadoOferta.EnRevision,
    profesiones: ['Marketing'],
    habilidades: [
      ['Ventas', true, 2],
      ['Licencia de conducir', true, 1],
    ],
    contrato: 'Plazo fijo',
    modalidad: 'Presencial',
    municipio: 'Oruro',
    salario: [3000, 3800],
    experiencia: 1,
    antiguedad: 3,
    descripcion:
      'Venta a tiendas de barrio con vehículo de la empresa. La empresa fue suspendida después de enviar esta oferta.',
    requisitos: ['Licencia de conducir categoría B', 'Experiencia en ventas'],
  },
];
