import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import { AccionAudit, TipoCatalogo } from '../common/enums';
import { hoyBolivia } from '../common/fechas';
import { R2Service } from '../storage/r2.service';
import { calcularCompletitud } from './completitud';
import {
  DatosPersonalesDto,
  ExperienciaDto,
  FormacionDto,
  HabilidadesPerfilDto,
} from './dto/perfil.dto';
import { Experiencia } from './entities/experiencia.entity';
import { Formacion } from './entities/formacion.entity';
import { PostulanteHabilidad } from './entities/postulante-habilidad.entity';
import { PostulanteProfile } from './entities/postulante-profile.entity';

interface Cambio {
  userId: number;
  ip: string;
  accion: AccionAudit;
  tabla: string;
  registroId: number | null;
  nuevos?: unknown;
}

@Injectable()
export class PostulantesService {
  constructor(
    @InjectRepository(PostulanteProfile)
    private readonly perfiles: Repository<PostulanteProfile>,
    @InjectRepository(Habilidad)
    private readonly habilidades: Repository<Habilidad>,
    private readonly dataSource: DataSource,
    private readonly catalogos: CatalogosService,
    private readonly r2: R2Service,
    private readonly audit: AuditService,
  ) {}

  /** Perfil del postulante autenticado, con usuario y listas. */
  async deUsuario(userId: number): Promise<PostulanteProfile> {
    const perfil = await this.perfiles.findOne({
      where: { user: { id: userId } },
      relations: {
        user: true,
        formaciones: true,
        experiencias: true,
        habilidades: true,
      },
    });
    if (!perfil) throw new NotFoundException('Perfil no encontrado');
    return perfil;
  }

  /** Ficha con URLs temporales de foto y CV. */
  async conUrls(perfil: PostulanteProfile) {
    const url = (key: string | null) =>
      key ? this.r2.getSignedUrl(key) : Promise.resolve(null);
    const [fotoUrl, cvUrl] = await Promise.all([
      url(perfil.fotoKey),
      url(perfil.cvKey),
    ]);
    return { ...perfil, fotoUrl, cvUrl };
  }

  async miPerfil(userId: number) {
    return this.conUrls(await this.deUsuario(userId));
  }

  async actualizarDatos(userId: number, dto: DatosPersonalesDto, ip: string) {
    if (dto.fechaNacimiento >= hoyBolivia()) {
      throw new BadRequestException('Fecha de nacimiento no válida');
    }
    const perfil = await this.deUsuario(userId);
    return this.guardar(perfil.id, async (manager) => {
      await manager.save(PostulanteProfile, {
        id: perfil.id,
        direccion: dto.direccion,
        fechaNacimiento: dto.fechaNacimiento,
        idiomas: dto.idiomas,
      });
      return {
        userId,
        ip,
        accion: AccionAudit.Update,
        tabla: 'postulante_profiles',
        registroId: perfil.id,
        nuevos: { direccion: dto.direccion },
      };
    });
  }

  async subirArchivo(
    userId: number,
    tipo: 'cv' | 'fotos',
    archivo: Express.Multer.File | undefined,
    ip: string,
  ) {
    const perfil = await this.deUsuario(userId);
    const columna = tipo === 'cv' ? 'cvKey' : 'fotoKey';
    const anterior = perfil[columna];
    const key = await this.r2.upload(tipo, archivo);
    const resultado = await this.guardar(perfil.id, async (manager) => {
      await manager.update(PostulanteProfile, perfil.id, { [columna]: key });
      return {
        userId,
        ip,
        accion: AccionAudit.Update,
        tabla: 'postulante_profiles',
        registroId: perfil.id,
        nuevos: { [columna]: key },
      };
    });
    if (anterior) await this.r2.delete(anterior).catch(() => undefined);
    return resultado;
  }

  async agregarFormacion(userId: number, dto: FormacionDto, ip: string) {
    const perfil = await this.deUsuario(userId);
    const profesion = await this.catalogos.exigir(
      dto.profesionId,
      TipoCatalogo.Profesion,
    );
    return this.guardar(perfil.id, async (manager) => {
      const fila = await manager.save(
        manager.create(Formacion, { ...dto, profile: perfil, profesion }),
      );
      return {
        userId,
        ip,
        accion: AccionAudit.Create,
        tabla: 'formaciones',
        registroId: fila.id,
      };
    });
  }

  async eliminarFormacion(userId: number, id: number, ip: string) {
    return this.eliminarFila(userId, Formacion, 'formaciones', id, ip);
  }

  async agregarExperiencia(userId: number, dto: ExperienciaDto, ip: string) {
    const perfil = await this.deUsuario(userId);
    return this.guardar(perfil.id, async (manager) => {
      const fila = await manager.save(
        manager.create(Experiencia, { ...dto, profile: perfil }),
      );
      return {
        userId,
        ip,
        accion: AccionAudit.Create,
        tabla: 'experiencias',
        registroId: fila.id,
      };
    });
  }

  async eliminarExperiencia(userId: number, id: number, ip: string) {
    return this.eliminarFila(userId, Experiencia, 'experiencias', id, ip);
  }

  /** Reemplaza la lista completa de habilidades del postulante. */
  async guardarHabilidades(
    userId: number,
    dto: HabilidadesPerfilDto,
    ip: string,
  ) {
    const ids = dto.habilidades.map((h) => h.habilidadId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay habilidades repetidas');
    }
    const validas = await this.habilidades.findBy({
      id: In(ids),
      activo: true,
    });
    if (validas.length !== ids.length) {
      throw new BadRequestException('Alguna habilidad no es válida');
    }
    const perfil = await this.deUsuario(userId);
    return this.guardar(perfil.id, async (manager) => {
      await manager.delete(PostulanteHabilidad, { profile: { id: perfil.id } });
      await manager.save(
        dto.habilidades.map((h) =>
          manager.create(PostulanteHabilidad, {
            profile: perfil,
            habilidad: validas.find((v) => v.id === h.habilidadId),
            nivel: h.nivel,
          }),
        ),
      );
      return {
        userId,
        ip,
        accion: AccionAudit.Update,
        tabla: 'postulante_habilidad',
        registroId: perfil.id,
        nuevos: dto.habilidades,
      };
    });
  }

  private async eliminarFila(
    userId: number,
    entidad: typeof Formacion | typeof Experiencia,
    tabla: string,
    id: number,
    ip: string,
  ) {
    const perfil = await this.deUsuario(userId);
    const existe = await this.dataSource.manager.existsBy(entidad, {
      id,
      profile: { id: perfil.id },
    });
    if (!existe) throw new NotFoundException('Registro no encontrado');
    return this.guardar(perfil.id, async (manager) => {
      await manager.delete(entidad, id);
      return {
        userId,
        ip,
        accion: AccionAudit.Delete,
        tabla,
        registroId: id,
      };
    });
  }

  /**
   * Toda modificación del perfil pasa por aquí: aplica el cambio, recalcula
   * el porcentaje y registra la auditoría en una sola transacción.
   */
  private async guardar(
    perfilId: number,
    cambio: (manager: EntityManager) => Promise<Cambio>,
  ) {
    const porcentaje = await this.dataSource.transaction(async (manager) => {
      const datos = await cambio(manager);
      const perfil = await manager.findOneOrFail(PostulanteProfile, {
        where: { id: perfilId },
        relations: { formaciones: true, experiencias: true, habilidades: true },
      });
      const nuevo = calcularCompletitud({
        direccion: perfil.direccion,
        fechaNacimiento: perfil.fechaNacimiento,
        fotoKey: perfil.fotoKey,
        cvKey: perfil.cvKey,
        idiomas: perfil.idiomas.length,
        formaciones: perfil.formaciones.length,
        experiencias: perfil.experiencias.length,
        habilidades: perfil.habilidades.length,
      });
      await manager.update(PostulanteProfile, perfilId, {
        porcentajeCompletitud: nuevo,
      });
      await this.audit.log(
        {
          userId: datos.userId,
          accion: datos.accion,
          tabla: datos.tabla,
          registroId: datos.registroId,
          nuevos: datos.nuevos,
          ip: datos.ip,
        },
        manager,
      );
      return nuevo;
    });
    return { porcentajeCompletitud: porcentaje };
  }
}
