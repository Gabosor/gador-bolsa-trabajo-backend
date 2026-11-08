import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { COSTO_BCRYPT } from '../auth/auth.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import {
  AccionAudit,
  EstadoEmpresa,
  Roles,
  TipoCatalogo,
} from '../common/enums';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { paginado } from '../common/pagination.dto';
import { R2Service } from '../storage/r2.service';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import {
  CambiarEstadoEmpresaDto,
  FiltroEmpresasDto,
  RegistrarEmpresaDto,
} from './dto/empresa.dto';
import { Empresa } from './entities/empresa.entity';

const { Pendiente, Aprobada, Rechazada, Suspendida } = EstadoEmpresa;

/** Estados a los que GADOR puede llevar una empresa desde cada estado. */
const TRANSICIONES: Record<EstadoEmpresa, EstadoEmpresa[]> = {
  [Pendiente]: [Aprobada, Rechazada],
  [Aprobada]: [Suspendida],
  [Rechazada]: [Aprobada],
  [Suspendida]: [Aprobada],
};

export interface ArchivosEmpresa {
  logo?: Express.Multer.File[];
  documentoNit?: Express.Multer.File[];
  documentoLegal?: Express.Multer.File[];
}

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly catalogos: CatalogosService,
    private readonly r2: R2Service,
    private readonly audit: AuditService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async registrar(
    dto: RegistrarEmpresaDto,
    archivos: ArchivosEmpresa,
    ip: string,
  ) {
    const documentoNit = archivos.documentoNit?.[0];
    const documentoLegal = archivos.documentoLegal?.[0];
    if (!documentoNit || !documentoLegal) {
      throw new BadRequestException('Debes adjuntar los dos documentos en PDF');
    }
    const repetida =
      (await this.empresas.existsBy({ nit: dto.nit })) ||
      (await this.users.existsBy({ email: dto.emailCorporativo }));
    if (repetida) {
      throw new ConflictException('El NIT o el email ya está registrado');
    }
    const rubro = await this.catalogos.exigir(dto.rubroId, TipoCatalogo.Rubro);

    const subidas: string[] = [];
    const subir = async (
      carpeta: 'documentos' | 'logos',
      archivo: Express.Multer.File | undefined,
    ) => {
      if (!archivo) return null;
      const key = await this.r2.upload(carpeta, archivo);
      subidas.push(key);
      return key;
    };

    try {
      const documentoNitKey = await subir('documentos', documentoNit);
      const documentoLegalKey = await subir('documentos', documentoLegal);
      const logoKey = await subir('logos', archivos.logo?.[0]);
      const password = await bcrypt.hash(dto.password, COSTO_BCRYPT);

      return await this.dataSource.transaction(async (manager) => {
        const role = await manager
          .getRepository(Role)
          .findOneByOrFail({ nombre: Roles.Empresa });
        const user = await manager.save(
          manager.create(User, {
            nombreCompleto: dto.representanteLegal,
            email: dto.emailCorporativo,
            celular: dto.celular,
            password,
            role,
            phoneVerified: true,
          }),
        );
        const empresa = await manager.save(
          manager.create(Empresa, {
            ...dto,
            user,
            rubro,
            logoKey,
            documentoNitKey,
            documentoLegalKey,
          }),
        );
        await this.audit.log(
          {
            userId: user.id,
            accion: AccionAudit.Create,
            tabla: 'empresas',
            registroId: empresa.id,
            nuevos: { nit: empresa.nit, estado: empresa.estado },
            ip,
          },
          manager,
        );
        return { id: empresa.id, estado: empresa.estado };
      });
    } catch (error) {
      // Sin registro no deben quedar archivos huérfanos en el bucket.
      await Promise.allSettled(subidas.map((key) => this.r2.delete(key)));
      throw error;
    }
  }

  /** Empresa del usuario autenticado. */
  async deUsuario(userId: number): Promise<Empresa> {
    const empresa = await this.empresas.findOneBy({ user: { id: userId } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  /** Solo las empresas aprobadas pueden operar con ofertas (RF06). */
  exigirAprobada(empresa: Empresa) {
    if (empresa.estado !== Aprobada) {
      throw new ForbiddenException('Tu empresa no está aprobada por GADOR');
    }
  }

  async miEmpresa(userId: number) {
    return this.conUrls(await this.deUsuario(userId));
  }

  async listar(filtro: FiltroEmpresasDto) {
    const [empresas, total] = await this.empresas.findAndCount({
      where: filtro.estado ? { estado: filtro.estado } : {},
      order: { createdAt: 'DESC' },
      skip: (filtro.page - 1) * filtro.limit,
      take: filtro.limit,
    });
    return paginado(empresas, total, filtro);
  }

  async detalle(id: number) {
    const empresa = await this.empresas.findOneBy({ id });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.conUrls(empresa);
  }

  async cambiarEstado(
    id: number,
    dto: CambiarEstadoEmpresaDto,
    adminId: number,
    ip: string,
  ) {
    const empresa = await this.empresas.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    const anterior = empresa.estado;
    if (!TRANSICIONES[anterior].includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede pasar de ${anterior} a ${dto.estado}`,
      );
    }
    const requiereMotivo = [Rechazada, Suspendida].includes(dto.estado);
    if (requiereMotivo && !dto.motivo?.trim()) {
      throw new BadRequestException('Debes indicar el motivo');
    }

    empresa.estado = dto.estado;
    empresa.motivoRechazo = requiereMotivo ? dto.motivo!.trim() : null;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(empresa);
      await this.audit.log(
        {
          userId: adminId,
          accion: AccionAudit.ChangeStatus,
          tabla: 'empresas',
          registroId: id,
          anteriores: { estado: anterior },
          nuevos: { estado: dto.estado, motivo: empresa.motivoRechazo },
          ip,
        },
        manager,
      );
    });

    const motivo = empresa.motivoRechazo
      ? ` Motivo: ${empresa.motivoRechazo}`
      : '';
    await this.notificaciones.notificar(
      empresa.user.id,
      'GADOR revisó tu empresa',
      `El estado de ${empresa.razonSocial} ahora es ${dto.estado}.${motivo}`,
    );
    const { user, ...datos } = empresa;
    void user;
    return datos;
  }

  private async conUrls(empresa: Empresa) {
    const url = (key: string | null) =>
      key ? this.r2.getSignedUrl(key) : Promise.resolve(null);
    const [logoUrl, documentoNitUrl, documentoLegalUrl] = await Promise.all([
      url(empresa.logoKey),
      url(empresa.documentoNitKey),
      url(empresa.documentoLegalKey),
    ]);
    return { ...empresa, logoUrl, documentoNitUrl, documentoLegalUrl };
  }
}
