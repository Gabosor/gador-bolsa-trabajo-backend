import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
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
import { CarpetaArchivo, R2Service } from '../storage/r2.service';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { documentoPdf, logoPng } from './demo/archivos';
import { EMPRESAS, OFERTAS, OfertaDemo, PERSONAS } from './demo/datos';

/**
 * Datos de ejemplo para la demostración (ver demo/datos.ts).
 *
 *   npm run seed:demo             crea los datos si no existen
 *   npm run seed:demo -- --reset  borra los datos demo y los vuelve a crear
 *
 * La contraseña de todas las cuentas se lee de DEMO_PASSWORD. Si R2 está
 * configurado, se suben logos y PDFs ficticios; si no, se crean sin archivos.
 */
const CORREOS_DEMO = 'demo.%@example.com';
const PDF = 'application/pdf';

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias: number) => new Date(Date.now() - dias * DIA);
const fechaEn = (dias: number) =>
  new Date(Date.now() + dias * DIA).toISOString().slice(0, 10);
const dos = (n: number) => String(n).padStart(2, '0');

/** Sube archivos a R2; si no está disponible, sigue sin ellos. */
class Almacen {
  private r2: R2Service | null = new R2Service(new ConfigService());
  readonly subidos: string[] = [];

  get activo() {
    return this.r2 !== null;
  }

  async subir(carpeta: CarpetaArchivo, buffer: Buffer, tipo: string) {
    if (!this.r2) return null;
    try {
      const key = await this.r2.upload(carpeta, {
        buffer,
        mimetype: tipo,
        size: buffer.length,
      } as Express.Multer.File);
      this.subidos.push(key);
      return key;
    } catch (error) {
      console.warn(
        `No se pudo subir a R2 (${(error as Error).message}). Se continúa sin archivos.`,
      );
      this.r2 = null;
      return null;
    }
  }

  async borrar(keys: string[]) {
    if (!this.r2) return;
    for (const key of keys) {
      try {
        await this.r2.delete(key);
      } catch (error) {
        console.warn(`No se pudo borrar ${key}: ${(error as Error).message}`);
      }
    }
  }
}

interface ArchivosEmpresa {
  logo: string | null;
  nit: string | null;
  legal: string | null;
}

/** Genera y sube los archivos antes de abrir la transacción. */
async function subirArchivos(almacen: Almacen) {
  const empresas: ArchivosEmpresa[] = [];
  for (const [i, e] of EMPRESAS.entries()) {
    const nit = `9000000${dos(i + 1)}`;
    const datos = [
      `Razón social: ${e.razon}`,
      `NIT: ${nit}`,
      `Rubro: ${e.rubro}`,
      'Domicilio: Oruro, Bolivia',
    ];
    empresas.push({
      logo: e.logo
        ? await almacen.subir(
            'logos',
            logoPng(e.logo.color, e.logo.figura),
            'image/png',
          )
        : null,
      nit: await almacen.subir(
        'documentos',
        await documentoPdf('Certificado de inscripción (NIT)', datos),
        PDF,
      ),
      legal: await almacen.subir(
        'documentos',
        await documentoPdf('Testimonio de constitución', [
          ...datos,
          `Representante legal: Representante ${e.razon}`,
        ]),
        PDF,
      ),
    });
  }
  const cvs: (string | null)[] = [];
  for (const p of PERSONAS) {
    cvs.push(
      p.cv
        ? await almacen.subir(
            'cv',
            await documentoPdf(`Hoja de vida: ${p.nombre}`, [
              `Profesión: ${p.profesion} (${p.institucion})`,
              `Último cargo: ${p.cargo} en ${p.empresaAnterior}, ${p.anios} años`,
              `Habilidades: ${p.habilidades.map(([h]) => h).join(', ')}`,
              p.experiencia.replace(/\*\*/g, ''),
            ]),
            PDF,
          )
        : null,
    );
  }
  return { empresas, cvs };
}

/** Textos de la oferta con el formato del editor (o planos, si así se pide). */
function textos(o: OfertaDemo) {
  const lista = (items: string[] | undefined, numerada = false) =>
    items?.length
      ? o.textoPlano
        ? items.join(' ')
        : items.map((t, i) => `${numerada ? `${i + 1}.` : '-'} ${t}`).join('\n')
      : null;
  return {
    descripcion: o.descripcion,
    requisitosObligatorios: lista(o.requisitos) ?? '',
    requisitosDeseables: lista(o.deseables),
    beneficios: lista(o.beneficios, true),
  };
}

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

/**
 * Borra los datos demo (usuarios demo.*@example.com y todo lo que cuelga de
 * ellos). Devuelve las claves de R2 para borrarlas tras el commit.
 */
async function reiniciar(manager: EntityManager): Promise<string[]> {
  const ids = async (sql: string, params: unknown[]) =>
    (await manager.query<{ id: number }[]>(sql, params)).map((r) => r.id);

  const usuarios = await ids('SELECT id FROM users WHERE email LIKE $1', [
    CORREOS_DEMO,
  ]);
  if (!usuarios.length) return [];
  type Fila = Record<string, string | number | null>;
  const empresas = await manager.query<Fila[]>(
    `SELECT id, logo_key, documento_nit_key, documento_legal_key
       FROM empresas WHERE user_id = ANY($1)`,
    [usuarios],
  );
  const perfiles = await manager.query<Fila[]>(
    'SELECT id, cv_key, foto_key FROM postulante_profiles WHERE user_id = ANY($1)',
    [usuarios],
  );
  const idsEmpresas = empresas.map((e) => e.id);
  const idsPerfiles = perfiles.map((p) => p.id);
  const ofertas = await ids(
    'SELECT id FROM ofertas WHERE empresa_id = ANY($1)',
    [idsEmpresas],
  );

  // Sin cascada en estas FK: el orden importa.
  const postulaciones = await ids(
    `DELETE FROM postulaciones
      WHERE oferta_id = ANY($1) OR postulante_id = ANY($2) RETURNING id`,
    [ofertas, idsPerfiles],
  );
  await manager.query('DELETE FROM ofertas WHERE id = ANY($1)', [ofertas]);
  await manager.query('DELETE FROM empresas WHERE id = ANY($1)', [idsEmpresas]);
  await manager.query('DELETE FROM users WHERE id = ANY($1)', [usuarios]);
  await manager.query(
    `DELETE FROM audit_logs
      WHERE user_id = ANY($1)
         OR (tabla_afectada = 'users' AND registro_id = ANY($1))
         OR (tabla_afectada = 'empresas' AND registro_id = ANY($2))
         OR (tabla_afectada = 'ofertas' AND registro_id = ANY($3))
         OR (tabla_afectada = 'postulaciones' AND registro_id = ANY($4))`,
    [usuarios, idsEmpresas, ofertas, postulaciones],
  );

  return [...empresas, ...perfiles]
    .flatMap((fila) => Object.entries(fila))
    .filter(([columna, valor]) => columna !== 'id' && typeof valor === 'string')
    .map(([, valor]) => valor as string);
}

async function crear(
  manager: EntityManager,
  password: string,
  admin: User,
  archivos: Awaited<ReturnType<typeof subirArchivos>>,
) {
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
    const n = dos(i + 1);
    const user = await manager.save(
      manager.create(User, {
        nombreCompleto: `Representante ${datos.razon}`,
        email: `demo.empresa${i + 1}@example.com`,
        celular: `710000${n}`,
        password,
        phoneVerified: true,
        role: rolEmpresa,
      }),
    );
    const empresa = await manager.save(
      manager.create(Empresa, {
        user,
        nit: `9000000${n}`,
        razonSocial: datos.razon,
        rubro: catalogo(TipoCatalogo.Rubro, datos.rubro),
        representanteLegal: user.nombreCompleto,
        ciRepresentante: `800000${n}`,
        celular: user.celular,
        emailCorporativo: user.email,
        direccion: `Calle Bolívar ${100 + i}, Oruro`,
        descripcion: datos.descripcion,
        logoKey: archivos.empresas[i].logo,
        documentoNitKey: archivos.empresas[i].nit,
        documentoLegalKey: archivos.empresas[i].legal,
        estado: datos.estado,
        motivoRechazo: datos.motivo ?? null,
        createdAt: haceDias(
          datos.estado === EstadoEmpresa.Pendiente ? 2 + i : 200 - i * 5,
        ),
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
    persona: (typeof PERSONAS)[number];
  }[] = [];
  for (const [i, persona] of PERSONAS.entries()) {
    const n = dos(i + 1);
    const user = await manager.save(
      manager.create(User, {
        nombreCompleto: persona.nombre,
        ci: `910000${n}`,
        email: `demo.postulante${i + 1}@example.com`,
        celular: `720000${n}`,
        password,
        phoneVerified: true,
        role: rolPostulante,
      }),
    );
    const base = {
      direccion: `Av. 6 de Agosto ${200 + i}, Oruro`,
      fechaNacimiento: `${1988 + (i % 12)}-0${(i % 9) + 1}-15`,
      idiomas: [{ nombre: 'Inglés', nivel: i % 2 ? 'Básico' : 'Intermedio' }],
    };
    const cvKey = archivos.cvs[i];
    const perfil = await manager.save(
      manager.create(PostulanteProfile, {
        user,
        ...base,
        cvKey,
        porcentajeCompletitud: calcularCompletitud({
          direccion: base.direccion,
          fechaNacimiento: base.fechaNacimiento,
          fotoKey: null,
          cvKey,
          idiomas: 1,
          formaciones: 1,
          experiencias: 1,
          habilidades: persona.habilidades.length,
        }),
      }),
    );
    await manager.save(
      manager.create(Formacion, {
        profile: perfil,
        profesion: catalogo(TipoCatalogo.Profesion, persona.profesion),
        institucion: persona.institucion,
        anioTitulacion: 2024 - persona.anios,
        nroTituloNacional: `DEMO-${1000 + i}`,
      }),
    );
    await manager.save(
      manager.create(Experiencia, {
        profile: perfil,
        empresa: persona.empresaAnterior,
        cargo: persona.cargo,
        anios: persona.anios,
        descripcion: persona.experiencia,
      }),
    );
    for (const [nombre, nivel] of persona.habilidades) {
      await manager.save(
        manager.create(PostulanteHabilidad, {
          profile: perfil,
          habilidad: habilidad(nombre),
          nivel,
        }),
      );
    }
    postulantes.push({ perfil, persona });
  }

  for (const [i, datos] of OFERTAS.entries()) {
    const empresa = empresas[datos.empresa];
    const creada = haceDias(datos.antiguedad);
    const vigente = datos.estado !== EstadoOferta.Cerrada;
    const oferta = await manager.save(
      manager.create(Oferta, {
        empresa,
        titulo: datos.titulo,
        ...textos(datos),
        profesiones: datos.profesiones.map((p) =>
          catalogo(TipoCatalogo.Profesion, p),
        ),
        aniosExperiencia: datos.experiencia,
        tipoContrato: catalogo(TipoCatalogo.TipoContrato, datos.contrato),
        modalidad: catalogo(TipoCatalogo.Modalidad, datos.modalidad),
        municipio: catalogo(TipoCatalogo.Municipio, datos.municipio),
        salarioMin: datos.salario?.[0] ?? null,
        salarioMax: datos.salario?.[1] ?? null,
        salarioATratar: datos.salario === null,
        fechaCierre: vigente
          ? fechaEn(20 + i)
          : fechaEn(-(datos.antiguedad - 30)),
        numeroPlazas: 1,
        estado: datos.estado,
        totalVistas: [EstadoOferta.Borrador, EstadoOferta.EnRevision].includes(
          datos.estado,
        )
          ? 0
          : 25 + i * 13,
        createdAt: creada,
        updatedAt: creada,
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

    // Postulan los del mismo campo, ordenados por MATCH.
    const requeridas = datos.habilidades.map(
      ([nombre, obligatoria, nivelMinimo]) => ({
        habilidadId: habilidad(nombre).id,
        obligatoria,
        nivelMinimo,
      }),
    );
    const candidatos = postulantes
      .filter(({ persona }) => persona.grupo === datos.grupo)
      .map(({ perfil, persona }) => ({
        perfil,
        match: calcularMatch(
          persona.habilidades.map(([nombre, nivel]) => ({
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

function imprimirCuentas() {
  console.log('\nCuentas (contraseña: la de DEMO_PASSWORD)');
  console.table([
    ...EMPRESAS.map((e, i) => ({
      correo: `demo.empresa${i + 1}@example.com`,
      rol: 'Empresa',
      detalle: `${e.razon} (${e.estado})`,
    })),
    ...PERSONAS.map((p, i) => ({
      correo: `demo.postulante${i + 1}@example.com`,
      rol: 'Postulante',
      detalle: `${p.nombre}, ${p.profesion}`,
    })),
  ]);
}

async function seedDemo() {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) throw new Error('Define DEMO_PASSWORD en el archivo .env');
  const reset = process.argv.includes('--reset');
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const existen = await users.existsBy({
      email: 'demo.empresa1@example.com',
    });
    if (existen && !reset) {
      console.log(
        'Los datos de ejemplo ya existen. Para recrearlos: npm run seed:demo -- --reset',
      );
      return;
    }
    const admin = await users.findOne({
      where: { role: { nombre: Roles.SuperAdmin } },
    });
    if (!admin) throw new Error('Ejecuta primero npm run seed');

    const almacen = new Almacen();
    if (reset) {
      const viejas = await dataSource.transaction(reiniciar);
      await almacen.borrar(viejas);
      console.log(
        `Datos demo anteriores borrados (${viejas.length} archivos).`,
      );
    }

    const archivos = await subirArchivos(almacen);
    if (!almacen.activo) console.warn('Los datos se crearán sin archivos.');
    const password = await bcrypt.hash(demoPassword, 12);
    try {
      await dataSource.transaction((manager) =>
        crear(manager, password, admin, archivos),
      );
    } catch (error) {
      // No dejar archivos huérfanos en el bucket.
      await almacen.borrar(almacen.subidos);
      throw error;
    }
    console.log(
      `Datos de ejemplo creados (${almacen.subidos.length} archivos en R2).`,
    );
    imprimirCuentas();
  } finally {
    await dataSource.destroy();
  }
}

seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
