import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { Configuracion } from '../catalogos/entities/configuracion.entity';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import {
  AccionAudit,
  EstadoEmpresa,
  EstadoOferta,
  Roles,
  TipoCatalogo,
} from '../common/enums';
import { hoyBolivia } from '../common/fechas';
import { paginado } from '../common/pagination.dto';
import { EmpresasService } from '../empresas/empresas.service';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Postulacion } from '../postulaciones/entities/postulacion.entity';
import { R2Service } from '../storage/r2.service';
import { User } from '../users/entities/user.entity';
import {
  BuscarOfertasDto,
  CambiarEstadoOfertaDto,
  FiltroOfertasDto,
  GuardarOfertaDto,
} from './dto/oferta.dto';
import { OfertaHabilidad } from './entities/oferta-habilidad.entity';
import { Oferta } from './entities/oferta.entity';
import { ESTADOS_ACTIVOS, puedeCambiarOferta } from './oferta-estados';

const RELACIONES = { empresa: true, habilidades: true, profesiones: true };

@Injectable()
export class OfertasService {
  constructor(
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(Habilidad)
    private readonly habilidades: Repository<Habilidad>,
    @InjectRepository(Configuracion)
    private readonly configuraciones: Repository<Configuracion>,
    @InjectRepository(Postulacion)
    private readonly postulaciones: Repository<Postulacion>,
    private readonly dataSource: DataSource,
    private readonly empresas: EmpresasService,
    private readonly catalogos: CatalogosService,
    private readonly audit: AuditService,
    private readonly r2: R2Service,
  ) {}

  async crear(userId: number, dto: GuardarOfertaDto, ip: string) {
    const empresa = await this.empresas.deUsuario(userId);
    this.empresas.exigirAprobada(empresa);
    const oferta = this.ofertas.create({ empresa });
    await this.aplicarDatos(oferta, dto);
    return this.guardar(oferta, AccionAudit.Create, userId, ip);
  }

  async actualizar(
    userId: number,
    id: number,
    dto: GuardarOfertaDto,
    ip: string,
  ) {
    const oferta = await this.propia(userId, id);
    this.exigirBorrador(oferta);
    await this.aplicarDatos(oferta, dto);
    return this.guardar(oferta, AccionAudit.Update, userId, ip);
  }

  async eliminar(userId: number, id: number, ip: string) {
    const oferta = await this.propia(userId, id);
    this.exigirBorrador(oferta);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Oferta, id);
      await this.audit.log(
        {
          userId,
          accion: AccionAudit.Delete,
          tabla: 'ofertas',
          registroId: id,
          anteriores: { titulo: oferta.titulo },
          ip,
        },
        manager,
      );
    });
    return { mensaje: 'Oferta eliminada' };
  }

  /** Copia una oferta como borrador nuevo para volver a publicarla (RF08). */
  async duplicar(userId: number, id: number, ip: string) {
    const original = await this.propia(userId, id);
    this.empresas.exigirAprobada(original.empresa);
    const copia = this.ofertas.create({
      ...original,
      id: undefined,
      titulo: `${original.titulo.slice(0, 142)} (copia)`,
      estado: EstadoOferta.Borrador,
      motivoRechazo: null,
      totalVistas: 0,
      avisoCierreEnviado: false,
      createdAt: undefined,
      updatedAt: undefined,
      habilidades: original.habilidades.map((h) =>
        this.dataSource.manager.create(OfertaHabilidad, {
          habilidad: h.habilidad,
          obligatoria: h.obligatoria,
          nivelMinimo: h.nivelMinimo,
        }),
      ),
    });
    return this.guardar(copia, AccionAudit.Create, userId, ip);
  }

  /** Panel "Mis ofertas" con el total de postulantes de cada una (RF09). */
  async misOfertas(userId: number, filtro: FiltroOfertasDto) {
    const empresa = await this.empresas.deUsuario(userId);
    const [ofertas, total] = await this.ofertas.findAndCount({
      where: {
        empresa: { id: empresa.id },
        ...(filtro.estado ? { estado: filtro.estado } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (filtro.page - 1) * filtro.limit,
      take: filtro.limit,
    });
    const conteos = await this.contarPostulantes(ofertas.map((o) => o.id));
    const data = ofertas.map((o) => ({
      ...o,
      totalPostulantes: conteos.get(o.id) ?? 0,
    }));
    return paginado(data, total, filtro);
  }

  async miOferta(userId: number, id: number) {
    return this.propia(userId, id);
  }

  /** Bandeja de GADOR; por defecto, las ofertas por revisar. */
  async listarRevision(filtro: FiltroOfertasDto) {
    const [data, total] = await this.ofertas.findAndCount({
      where: { estado: filtro.estado ?? EstadoOferta.EnRevision },
      relations: RELACIONES,
      order: { updatedAt: 'ASC' },
      skip: (filtro.page - 1) * filtro.limit,
      take: filtro.limit,
    });
    return paginado(data, total, filtro);
  }

  async cambiarEstado(
    user: User,
    id: number,
    dto: CambiarEstadoOfertaDto,
    ip: string,
  ) {
    const oferta = await this.ofertas.findOne({
      where: { id },
      relations: { empresa: true },
    });
    if (!oferta) throw new NotFoundException('Oferta no encontrada');

    const esGador = user.role.nombre === (Roles.SuperAdmin as string);
    if (!esGador) await this.exigirDuenio(user.id, oferta.empresa);

    const anterior = oferta.estado;
    const nuevo = dto.estado;
    if (!puedeCambiarOferta(esGador ? 'GADOR' : 'EMPRESA', anterior, nuevo)) {
      throw new BadRequestException(
        `No se puede pasar de ${anterior} a ${nuevo}`,
      );
    }

    if (nuevo === EstadoOferta.EnRevision) {
      this.empresas.exigirAprobada(oferta.empresa);
      this.exigirFechaVigente(oferta.fechaCierre);
      await this.exigirCupo(oferta.empresa);
      oferta.motivoRechazo = null;
    }
    if (nuevo === EstadoOferta.Publicada) {
      this.empresas.exigirAprobada(oferta.empresa);
      this.exigirFechaVigente(oferta.fechaCierre);
    }
    if (nuevo === EstadoOferta.Borrador) {
      if (!dto.motivo?.trim()) {
        throw new BadRequestException('Debes indicar el motivo del rechazo');
      }
      oferta.motivoRechazo = dto.motivo.trim();
    }

    oferta.estado = nuevo;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(oferta);
      await this.audit.log(
        {
          userId: user.id,
          accion: AccionAudit.ChangeStatus,
          tabla: 'ofertas',
          registroId: id,
          anteriores: { estado: anterior },
          nuevos: { estado: nuevo, motivo: oferta.motivoRechazo },
          ip,
        },
        manager,
      );
    });
    return { id, estado: nuevo };
  }

  /** Buscador público: solo ofertas visibles para los postulantes (RF03). */
  async buscar(filtro: BuscarOfertasDto) {
    const qb = this.consultaPublica();
    if (filtro.q?.trim()) {
      const texto = filtro.q.trim().replace(/[%_\\]/g, '\\$&');
      qb.andWhere('(o.titulo ILIKE :q OR o.descripcion ILIKE :q)', {
        q: `%${texto}%`,
      });
    }
    if (filtro.profesionId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM oferta_profesion op WHERE op.oferta_id = o.id AND op.profesion_id = :profesionId)',
        { profesionId: filtro.profesionId },
      );
    }
    if (filtro.municipioId) {
      qb.andWhere('municipio.id = :municipioId', {
        municipioId: filtro.municipioId,
      });
    }
    if (filtro.modalidadId) {
      qb.andWhere('modalidad.id = :modalidadId', {
        modalidadId: filtro.modalidadId,
      });
    }
    if (filtro.salarioMin) {
      // Las ofertas "a tratar" no se descartan: su salario no se conoce.
      qb.andWhere('(o.salarioATratar = true OR o.salarioMax >= :salario)', {
        salario: filtro.salarioMin,
      });
    }
    const [ofertas, total] = await qb
      .orderBy('o.createdAt', 'DESC')
      .skip((filtro.page - 1) * filtro.limit)
      .take(filtro.limit)
      .getManyAndCount();
    const data = await Promise.all(ofertas.map((o) => this.vistaPublica(o)));
    return paginado(data, total, filtro);
  }

  /** Detalle público; cada apertura suma una vista (RF09). */
  async detallePublico(id: number) {
    const oferta = await this.consultaPublica()
      .leftJoinAndSelect('o.habilidades', 'oh')
      .leftJoinAndSelect('oh.habilidad', 'habilidad')
      .andWhere('o.id = :id', { id })
      .getOne();
    if (!oferta) throw new NotFoundException('Oferta no disponible');
    await this.ofertas.increment({ id }, 'totalVistas', 1);
    return this.vistaPublica(oferta);
  }

  private consultaPublica() {
    return this.ofertas
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.empresa', 'empresa')
      .leftJoinAndSelect('empresa.rubro', 'rubro')
      .leftJoinAndSelect('o.tipoContrato', 'tipoContrato')
      .leftJoinAndSelect('o.modalidad', 'modalidad')
      .leftJoinAndSelect('o.municipio', 'municipio')
      .leftJoinAndSelect('o.profesiones', 'profesiones')
      .where('o.estado = :publicada', { publicada: EstadoOferta.Publicada })
      .andWhere('o.fechaCierre >= :hoy', { hoy: hoyBolivia() })
      .andWhere('empresa.estado = :aprobada', {
        aprobada: EstadoEmpresa.Aprobada,
      });
  }

  /** Quita de la respuesta pública el NIT, el CI y los datos internos. */
  private async vistaPublica(oferta: Oferta) {
    const { empresa, motivoRechazo, avisoCierreEnviado, ...resto } = oferta;
    void motivoRechazo;
    void avisoCierreEnviado;
    return {
      ...resto,
      empresa: {
        id: empresa.id,
        razonSocial: empresa.razonSocial,
        rubro: empresa.rubro,
        descripcion: empresa.descripcion,
        logoUrl: empresa.logoKey
          ? await this.r2.getSignedUrl(empresa.logoKey, 3600)
          : null,
      },
    };
  }

  private async propia(userId: number, id: number): Promise<Oferta> {
    const empresa = await this.empresas.deUsuario(userId);
    const oferta = await this.ofertas.findOne({
      where: { id, empresa: { id: empresa.id } },
      relations: RELACIONES,
    });
    if (!oferta) throw new NotFoundException('Oferta no encontrada');
    return oferta;
  }

  private async exigirDuenio(userId: number, empresa: Empresa) {
    const propia = await this.empresas.deUsuario(userId);
    if (propia.id !== empresa.id) {
      throw new NotFoundException('Oferta no encontrada');
    }
  }

  private exigirBorrador(oferta: Oferta) {
    if (oferta.estado !== EstadoOferta.Borrador) {
      throw new ForbiddenException('Solo se edita una oferta en BORRADOR');
    }
  }

  private exigirFechaVigente(fechaCierre: string) {
    if (fechaCierre < hoyBolivia()) {
      throw new BadRequestException('La fecha de cierre ya pasó');
    }
  }

  private async exigirCupo(empresa: Empresa) {
    const config = await this.configuraciones.findOneBy({
      clave: 'LIMITE_OFERTAS_ACTIVAS',
    });
    const limite = Number(config?.valor ?? 5);
    const activas = await this.ofertas.countBy({
      empresa: { id: empresa.id },
      estado: In(ESTADOS_ACTIVOS),
    });
    if (activas >= limite) {
      throw new ConflictException(
        `Alcanzaste el límite de ${limite} ofertas activas`,
      );
    }
  }

  /** Valida el DTO contra las reglas y los catálogos, y lo copia a la oferta. */
  private async aplicarDatos(oferta: Oferta, dto: GuardarOfertaDto) {
    this.exigirFechaVigente(dto.fechaCierre);
    if (dto.salarioATratar) {
      oferta.salarioMin = null;
      oferta.salarioMax = null;
    } else {
      if (!dto.salarioMin || !dto.salarioMax || dto.salarioMin > dto.salarioMax) {
        throw new BadRequestException(
          'Indica un rango de salario válido o marca "A tratar"',
        );
      }
      oferta.salarioMin = dto.salarioMin;
      oferta.salarioMax = dto.salarioMax;
    }

    const ids = dto.habilidades.map((h) => h.habilidadId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay habilidades repetidas');
    }
    const encontradas = await this.habilidades.findBy({
      id: In(ids),
      activo: true,
    });
    if (encontradas.length !== ids.length) {
      throw new BadRequestException('Alguna habilidad no es válida');
    }

    const [tipoContrato, modalidad, municipio, ...profesiones] =
      await Promise.all([
        this.catalogos.exigir(dto.tipoContratoId, TipoCatalogo.TipoContrato),
        this.catalogos.exigir(dto.modalidadId, TipoCatalogo.Modalidad),
        this.catalogos.exigir(dto.municipioId, TipoCatalogo.Municipio),
        ...[...new Set(dto.profesionIds)].map((id) =>
          this.catalogos.exigir(id, TipoCatalogo.Profesion),
        ),
      ]);

    Object.assign(oferta, {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      requisitosObligatorios: dto.requisitosObligatorios,
      requisitosDeseables: dto.requisitosDeseables ?? null,
      aniosExperiencia: dto.aniosExperiencia,
      salarioATratar: dto.salarioATratar,
      beneficios: dto.beneficios ?? null,
      fechaCierre: dto.fechaCierre,
      numeroPlazas: dto.numeroPlazas,
      tipoContrato,
      modalidad,
      municipio,
      profesiones,
      habilidades: dto.habilidades.map((h) =>
        this.dataSource.manager.create(OfertaHabilidad, {
          habilidad: encontradas.find((e) => e.id === h.habilidadId),
          obligatoria: h.obligatoria,
          nivelMinimo: h.nivelMinimo,
        }),
      ),
    });
  }

  private async guardar(
    oferta: Oferta,
    accion: AccionAudit,
    userId: number,
    ip: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      if (oferta.id) {
        await manager.delete(OfertaHabilidad, { oferta: { id: oferta.id } });
      }
      const guardada = await manager.save(oferta);
      await this.audit.log(
        {
          userId,
          accion,
          tabla: 'ofertas',
          registroId: guardada.id,
          nuevos: { titulo: guardada.titulo, estado: guardada.estado },
          ip,
        },
        manager,
      );
      return guardada;
    });
  }

  private async contarPostulantes(ids: number[]) {
    if (ids.length === 0) return new Map<number, number>();
    const filas = await this.postulaciones
      .createQueryBuilder('p')
      .select('p.oferta_id', 'ofertaId')
      .addSelect('COUNT(*)', 'total')
      .where('p.oferta_id IN (:...ids)', { ids })
      .groupBy('p.oferta_id')
      .getRawMany<{ ofertaId: number; total: string }>();
    return new Map(filas.map((f) => [f.ofertaId, Number(f.total)]));
  }
}
