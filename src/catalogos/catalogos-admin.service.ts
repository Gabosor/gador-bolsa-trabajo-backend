import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { AccionAudit, TipoCatalogo } from '../common/enums';
import { clave } from '../common/texto';
import {
  ActualizarCatalogoDto,
  ActualizarHabilidadDto,
  ConfiguracionDto,
  CrearCatalogoDto,
  CrearHabilidadDto,
} from './dto/admin.dto';
import { Catalogo } from './entities/catalogo.entity';
import { Configuracion } from './entities/configuracion.entity';
import { Habilidad } from './entities/habilidad.entity';

const LIMITE = 'LIMITE_OFERTAS_ACTIVAS';

/** Quién hizo el cambio, para la auditoría. */
export interface Actor {
  userId: number;
  ip: string;
}

/** RF15. No se borran registros: se desactivan para conservar el historial. */
@Injectable()
export class CatalogosAdminService {
  constructor(
    @InjectRepository(Catalogo)
    private readonly catalogos: Repository<Catalogo>,
    @InjectRepository(Habilidad)
    private readonly habilidades: Repository<Habilidad>,
    @InjectRepository(Configuracion)
    private readonly configuraciones: Repository<Configuracion>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  listarCatalogo(tipo: TipoCatalogo) {
    return this.catalogos.find({
      where: { tipo },
      relations: { parent: true },
      order: { nombre: 'ASC' },
    });
  }

  listarHabilidades() {
    return this.habilidades.find({
      relations: { area: true },
      order: { nombre: 'ASC' },
    });
  }

  async crearCatalogo(dto: CrearCatalogoDto, actor: Actor) {
    const parent = await this.resolverPadre(dto.tipo, dto.parentId);
    await this.exigirCatalogoLibre(dto.tipo, dto.nombre, parent?.id ?? null);
    const item = this.catalogos.create({
      tipo: dto.tipo,
      nombre: dto.nombre,
      parent,
    });
    return this.guardar(item, 'catalogos', AccionAudit.Create, actor, null);
  }

  async actualizarCatalogo(
    id: number,
    dto: ActualizarCatalogoDto,
    actor: Actor,
  ) {
    const item = await this.catalogos.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Registro no encontrado');
    const anterior = this.estado(item);
    if (dto.parentId !== undefined) {
      item.parent = await this.resolverPadre(item.tipo, dto.parentId);
    }
    if (dto.nombre !== undefined && dto.nombre !== item.nombre) {
      await this.exigirCatalogoLibre(
        item.tipo,
        dto.nombre,
        item.parent?.id ?? null,
        id,
      );
      item.nombre = dto.nombre;
    }
    if (dto.activo !== undefined) item.activo = dto.activo;
    return this.guardar(item, 'catalogos', AccionAudit.Update, actor, anterior);
  }

  async crearHabilidad(dto: CrearHabilidadDto, actor: Actor) {
    await this.exigirHabilidadLibre(dto.nombre);
    const item = this.habilidades.create({
      nombre: dto.nombre,
      area: await this.resolverArea(dto.areaId),
    });
    return this.guardar(item, 'habilidades', AccionAudit.Create, actor, null);
  }

  async actualizarHabilidad(
    id: number,
    dto: ActualizarHabilidadDto,
    actor: Actor,
  ) {
    const item = await this.habilidades.findOne({
      where: { id },
      relations: { area: true },
    });
    if (!item) throw new NotFoundException('Registro no encontrado');
    const anterior = this.estado(item);
    if (dto.nombre !== undefined && dto.nombre !== item.nombre) {
      await this.exigirHabilidadLibre(dto.nombre, id);
      item.nombre = dto.nombre;
    }
    if (dto.areaId !== undefined) {
      item.area = await this.resolverArea(dto.areaId);
    }
    if (dto.activo !== undefined) item.activo = dto.activo;
    return this.guardar(
      item,
      'habilidades',
      AccionAudit.Update,
      actor,
      anterior,
    );
  }

  async obtenerConfiguracion() {
    const fila = await this.configuraciones.findOneBy({ clave: LIMITE });
    return { limiteOfertasActivas: Number(fila?.valor ?? 5) };
  }

  async guardarConfiguracion(dto: ConfiguracionDto, actor: Actor) {
    const anterior = await this.obtenerConfiguracion();
    await this.dataSource.transaction(async (manager) => {
      await manager.upsert(
        Configuracion,
        { clave: LIMITE, valor: String(dto.limiteOfertasActivas) },
        ['clave'],
      );
      await this.audit.log(
        {
          userId: actor.userId,
          accion: AccionAudit.Update,
          tabla: 'configuraciones',
          registroId: null,
          anteriores: anterior,
          nuevos: dto,
          ip: actor.ip,
        },
        manager,
      );
    });
    return dto;
  }

  /**
   * Municipio → departamento (obligatorio); profesión → área (opcional).
   * El resto de los catálogos no tiene jerarquía.
   */
  private async resolverPadre(
    tipo: TipoCatalogo,
    parentId: number | null | undefined,
  ): Promise<Catalogo | null> {
    if (tipo === TipoCatalogo.Municipio) {
      const departamento = parentId
        ? await this.catalogos.findOneBy({
            id: parentId,
            tipo: TipoCatalogo.Departamento,
          })
        : null;
      if (!departamento) {
        throw new BadRequestException('Selecciona un departamento');
      }
      return departamento;
    }
    if (tipo === TipoCatalogo.Profesion) return this.resolverArea(parentId);
    if (parentId != null) {
      throw new BadRequestException('Este catálogo no se agrupa');
    }
    return null;
  }

  private async resolverArea(
    areaId: number | null | undefined,
  ): Promise<Catalogo | null> {
    if (areaId == null) return null;
    const area = await this.catalogos.findOneBy({
      id: areaId,
      tipo: TipoCatalogo.Area,
    });
    if (!area) throw new BadRequestException('Selecciona un área válida');
    return area;
  }

  /** Solo los municipios se repiten entre padres; el resto es único. */
  private async exigirCatalogoLibre(
    tipo: TipoCatalogo,
    nombre: string,
    parentId: number | null,
    idActual?: number,
  ) {
    const existentes = await this.listarCatalogo(tipo);
    const porPadre = tipo === TipoCatalogo.Municipio;
    const repetido = existentes.some(
      (e) =>
        e.id !== idActual &&
        (!porPadre || (e.parent?.id ?? null) === parentId) &&
        clave(e.nombre) === clave(nombre),
    );
    if (repetido) throw new ConflictException('Ese nombre ya existe');
  }

  private async exigirHabilidadLibre(nombre: string, idActual?: number) {
    const existentes = await this.listarHabilidades();
    const repetido = existentes.some(
      (e) => e.id !== idActual && clave(e.nombre) === clave(nombre),
    );
    if (repetido) throw new ConflictException('Ese nombre ya existe');
  }

  /** Lo que se guarda en la auditoría antes y después de un cambio. */
  private estado(item: Catalogo | Habilidad) {
    return item instanceof Habilidad || 'area' in item
      ? {
          nombre: item.nombre,
          activo: item.activo,
          areaId: (item as Habilidad).area?.id ?? null,
        }
      : {
          nombre: item.nombre,
          activo: item.activo,
          parentId: item.parent?.id ?? null,
        };
  }

  /** Guarda el registro y su auditoría en la misma transacción. */
  private guardar<T extends Catalogo | Habilidad>(
    item: T,
    tabla: string,
    accion: AccionAudit,
    actor: Actor,
    anteriores: unknown,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const guardado = await manager.save(item);
      await this.audit.log(
        {
          userId: actor.userId,
          accion,
          tabla,
          registroId: guardado.id,
          anteriores,
          nuevos: this.estado(guardado),
          ip: actor.ip,
        },
        manager,
      );
      return guardado;
    });
  }
}
