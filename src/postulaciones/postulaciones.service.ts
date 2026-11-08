import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import {
  AccionAudit,
  EstadoEmpresa,
  EstadoOferta,
  EstadoPostulacion,
} from '../common/enums';
import { hoyBolivia } from '../common/fechas';
import { paginado, PaginationDto } from '../common/pagination.dto';
import { Favorito } from '../ofertas/entities/favorito.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { perfilPuedePostular } from '../postulantes/completitud';
import { PostulantesService } from '../postulantes/postulantes.service';
import { calcularMatch } from './match';
import { Postulacion } from './entities/postulacion.entity';

@Injectable()
export class PostulacionesService {
  constructor(
    @InjectRepository(Postulacion)
    private readonly postulaciones: Repository<Postulacion>,
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(Favorito)
    private readonly favoritos: Repository<Favorito>,
    private readonly dataSource: DataSource,
    private readonly postulantes: PostulantesService,
    private readonly audit: AuditService,
  ) {}

  /** Motor de postulación en 1 clic (RF10). */
  async postular(userId: number, ofertaId: number, ip: string) {
    const perfil = await this.postulantes.deUsuario(userId);
    if (!perfilPuedePostular(perfil.porcentajeCompletitud)) {
      throw new ForbiddenException(
        `Tu perfil está al ${perfil.porcentajeCompletitud} %. Necesitas más del 80 %`,
      );
    }
    const oferta = await this.ofertaDisponible(ofertaId);
    const yaPostulo = await this.postulaciones.existsBy({
      oferta: { id: ofertaId },
      postulante: { id: perfil.id },
    });
    if (yaPostulo) throw new ConflictException('Ya postulaste a esta oferta');

    const porcentajeMatch = calcularMatch(
      perfil.habilidades.map((h) => ({
        habilidadId: h.habilidad.id,
        nivel: h.nivel,
      })),
      oferta.habilidades.map((h) => ({
        habilidadId: h.habilidad.id,
        obligatoria: h.obligatoria,
        nivelMinimo: h.nivelMinimo,
      })),
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const nueva = await manager.save(
          manager.create(Postulacion, {
            oferta,
            postulante: perfil,
            porcentajeMatch,
          }),
        );
        await this.audit.log(
          {
            userId,
            accion: AccionAudit.Create,
            tabla: 'postulaciones',
            registroId: nueva.id,
            nuevos: { ofertaId, porcentajeMatch },
            ip,
          },
          manager,
        );
        return { id: nueva.id, estado: nueva.estado, porcentajeMatch };
      });
    } catch (error) {
      // Dos clics simultáneos: la restricción única de la BD detiene el segundo.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya postulaste a esta oferta');
      }
      throw error;
    }
  }

  /** Historial de postulaciones (RF04). */
  async misPostulaciones(userId: number, filtro: PaginationDto) {
    const perfil = await this.postulantes.deUsuario(userId);
    const [data, total] = await this.postulaciones.findAndCount({
      where: { postulante: { id: perfil.id } },
      relations: { oferta: { empresa: true } },
      select: {
        id: true,
        estado: true,
        porcentajeMatch: true,
        createdAt: true,
        oferta: {
          id: true,
          titulo: true,
          estado: true,
          fechaCierre: true,
          descripcion: true,
          requisitosObligatorios: true,
          empresa: { id: true, razonSocial: true },
        },
      },
      order: { createdAt: 'DESC' },
      skip: (filtro.page - 1) * filtro.limit,
      take: filtro.limit,
    });
    return paginado(data, total, filtro);
  }

  /** Solo se puede retirar mientras la empresa no la haya visto (RF04). */
  async retirar(userId: number, id: number, ip: string) {
    const perfil = await this.postulantes.deUsuario(userId);
    const postulacion = await this.postulaciones.findOneBy({
      id,
      postulante: { id: perfil.id },
    });
    if (!postulacion) throw new NotFoundException('Postulación no encontrada');
    if (postulacion.estado !== EstadoPostulacion.Postulado) {
      throw new ForbiddenException(
        'La empresa ya vio tu postulación; no se puede retirar',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Postulacion, id);
      await this.audit.log(
        {
          userId,
          accion: AccionAudit.Delete,
          tabla: 'postulaciones',
          registroId: id,
          anteriores: { estado: postulacion.estado },
          ip,
        },
        manager,
      );
    });
    return { mensaje: 'Postulación retirada' };
  }

  async misFavoritos(userId: number) {
    const perfil = await this.postulantes.deUsuario(userId);
    return this.favoritos.find({
      where: { profile: { id: perfil.id } },
      relations: { oferta: { empresa: true } },
      select: {
        id: true,
        createdAt: true,
        oferta: {
          id: true,
          titulo: true,
          estado: true,
          fechaCierre: true,
          empresa: { id: true, razonSocial: true },
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async agregarFavorito(userId: number, ofertaId: number) {
    const perfil = await this.postulantes.deUsuario(userId);
    if (!(await this.ofertas.existsBy({ id: ofertaId }))) {
      throw new NotFoundException('Oferta no encontrada');
    }
    await this.favoritos.upsert(
      { profile: { id: perfil.id }, oferta: { id: ofertaId } },
      ['profile', 'oferta'],
    );
    return { mensaje: 'Guardada en favoritos' };
  }

  async quitarFavorito(userId: number, ofertaId: number) {
    const perfil = await this.postulantes.deUsuario(userId);
    await this.favoritos.delete({
      profile: { id: perfil.id },
      oferta: { id: ofertaId },
    });
    return { mensaje: 'Quitada de favoritos' };
  }

  private async ofertaDisponible(id: number): Promise<Oferta> {
    const oferta = await this.ofertas.findOne({
      where: { id },
      relations: { empresa: true, habilidades: true },
    });
    if (!oferta) throw new NotFoundException('Oferta no encontrada');
    if (
      oferta.estado !== EstadoOferta.Publicada ||
      oferta.empresa.estado !== EstadoEmpresa.Aprobada
    ) {
      throw new BadRequestException('La oferta no está disponible');
    }
    if (oferta.fechaCierre < hoyBolivia()) {
      throw new BadRequestException('La oferta ya cerró');
    }
    return oferta;
  }
}
