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
import {
  ActualizarItemDto,
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
    return this.habilidades.find({ order: { nombre: 'ASC' } });
  }

  async crearCatalogo(dto: CrearCatalogoDto, actor: Actor) {
    const parent = await this.resolverPadre(dto);
    await this.exigirCatalogoLibre(dto.tipo, dto.nombre, parent?.id ?? null);
    const item = this.catalogos.create({
      tipo: dto.tipo,
      nombre: dto.nombre,
      parent,
    });
    return this.guardar(item, 'catalogos', AccionAudit.Create, actor, null);
  }

  async actualizarCatalogo(id: number, dto: ActualizarItemDto, actor: Actor) {
    const item = await this.catalogos.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Registro no encontrado');
    const anterior = { nombre: item.nombre, activo: item.activo };
    if (dto.nombre && dto.nombre !== item.nombre) {
      await this.exigirCatalogoLibre(
        item.tipo,
        dto.nombre,
        item.parent?.id ?? null,
        id,
      );
    }
    Object.assign(item, dto);
    return this.guardar(item, 'catalogos', AccionAudit.Update, actor, anterior);
  }

  async crearHabilidad(dto: CrearHabilidadDto, actor: Actor) {
    await this.exigirHabilidadLibre(dto.nombre);
    const item = this.habilidades.create({ nombre: dto.nombre });
    return this.guardar(item, 'habilidades', AccionAudit.Create, actor, null);
  }

  async actualizarHabilidad(id: number, dto: ActualizarItemDto, actor: Actor) {
    const item = await this.habilidades.findOneBy({ id });
    if (!item) throw new NotFoundException('Registro no encontrado');
    if (dto.nombre && dto.nombre.length > 80) {
      throw new BadRequestException('El nombre admite hasta 80 caracteres');
    }
    const anterior = { nombre: item.nombre, activo: item.activo };
    if (dto.nombre && dto.nombre !== item.nombre) {
      await this.exigirHabilidadLibre(dto.nombre, id);
    }
    Object.assign(item, dto);
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

  /** Los municipios deben pertenecer a un departamento; el resto, a nadie. */
  private async resolverPadre(dto: CrearCatalogoDto) {
    if (dto.tipo !== TipoCatalogo.Municipio) return null;
    const padre = dto.parentId
      ? await this.catalogos.findOneBy({
          id: dto.parentId,
          tipo: TipoCatalogo.Departamento,
        })
      : null;
    if (!padre) throw new BadRequestException('Selecciona un departamento');
    return padre;
  }

  private async exigirCatalogoLibre(
    tipo: TipoCatalogo,
    nombre: string,
    parentId: number | null,
    idActual?: number,
  ) {
    const existentes = await this.listarCatalogo(tipo);
    const repetido = existentes.some(
      (e) =>
        e.id !== idActual &&
        (e.parent?.id ?? null) === parentId &&
        e.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (repetido) throw new ConflictException('Ese nombre ya existe');
  }

  private async exigirHabilidadLibre(nombre: string, idActual?: number) {
    const existentes = await this.listarHabilidades();
    const repetido = existentes.some(
      (e) =>
        e.id !== idActual && e.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (repetido) throw new ConflictException('Ese nombre ya existe');
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
          nuevos: { nombre: guardado.nombre, activo: guardado.activo },
          ip: actor.ip,
        },
        manager,
      );
      return guardado;
    });
  }
}
