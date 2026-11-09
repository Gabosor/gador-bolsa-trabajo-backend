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
  Roles,
} from '../common/enums';
import { NOMBRE_ESTADO_POSTULACION } from '../common/etiquetas';
import { hoyBolivia } from '../common/fechas';
import { paginado, PaginationDto } from '../common/pagination.dto';
import { EmpresasService } from '../empresas/empresas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { R2Service } from '../storage/r2.service';
import { User } from '../users/entities/user.entity';
import { puedeCambiarPostulacion } from './postulacion-estados';
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
    private readonly empresas: EmpresasService,
    private readonly notificaciones: NotificacionesService,
    private readonly r2: R2Service,
    private readonly audit: AuditService,
  ) {}

  /** Vista previa del % MATCH antes de postular, sin registrar nada. */
  async compatibilidad(userId: number, ofertaId: number) {
    const perfil = await this.postulantes.deUsuario(userId);
    const oferta = await this.ofertaDisponible(ofertaId);
    const propias = perfil.habilidades.map((h) => ({
      habilidadId: h.habilidad.id,
      nivel: h.nivel,
    }));
    return {
      porcentaje: calcularMatch(
        propias,
        oferta.habilidades.map((h) => ({
          habilidadId: h.habilidad.id,
          obligatoria: h.obligatoria,
          nivelMinimo: h.nivelMinimo,
        })),
      ),
      porcentajePerfil: perfil.porcentajeCompletitud,
      puedePostular: perfilPuedePostular(perfil.porcentajeCompletitud),
      habilidades: oferta.habilidades.map((h) => {
        const nivelPropio =
          propias.find((p) => p.habilidadId === h.habilidad.id)?.nivel ?? null;
        return {
          habilidadId: h.habilidad.id,
          nivelPropio,
          cumple: nivelPropio !== null && nivelPropio >= h.nivelMinimo,
        };
      }),
    };
  }

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

  /** Postulantes de una oferta, ordenados por % MATCH (RF11). */
  async postulantesDeOferta(userId: number, ofertaId: number) {
    const empresa = await this.empresas.deUsuario(userId);
    this.empresas.exigirAprobada(empresa);
    const oferta = await this.ofertas.findOneBy({
      id: ofertaId,
      empresa: { id: empresa.id },
    });
    if (!oferta) throw new NotFoundException('Oferta no encontrada');

    const postulaciones = await this.postulaciones.find({
      where: { oferta: { id: ofertaId } },
      relations: {
        postulante: { user: true, formaciones: true, experiencias: true },
      },
      order: { porcentajeMatch: 'DESC', createdAt: 'ASC' },
    });
    const postulantes = await Promise.all(
      postulaciones.map(async (p) => ({
        id: p.id,
        estado: p.estado,
        porcentajeMatch: p.porcentajeMatch,
        nombre: p.postulante.user.nombreCompleto,
        fotoUrl: p.postulante.fotoKey
          ? await this.r2.getSignedUrl(p.postulante.fotoKey)
          : null,
        profesion: p.postulante.formaciones[0]?.profesion.nombre ?? null,
        aniosExperiencia: p.postulante.experiencias.reduce(
          (suma, e) => suma + e.anios,
          0,
        ),
      })),
    );
    return { oferta: { id: oferta.id, titulo: oferta.titulo }, postulantes };
  }

  /**
   * Perfil completo y URL del CV. Solo para la empresa de la oferta o GADOR.
   * Cuando lo abre la empresa, la postulación pasa a VISTO y se avisa (RF12).
   */
  async verPerfil(user: User, id: number, ip: string) {
    const postulacion = await this.cargarConDuenio(id);
    const esEmpresa = user.role.nombre === (Roles.Empresa as string);
    if (esEmpresa) await this.exigirDuenio(user.id, postulacion);

    const perfil = await this.postulantes.conUrls(
      await this.postulantes.deUsuario(postulacion.postulante.user.id),
    );
    if (esEmpresa && postulacion.estado === EstadoPostulacion.Postulado) {
      await this.transicionar(
        postulacion,
        EstadoPostulacion.Visto,
        user.id,
        ip,
      );
    }
    const { nombreCompleto, email, ci, celular } = perfil.user;
    return {
      postulacion: {
        id: postulacion.id,
        estado: postulacion.estado,
        porcentajeMatch: postulacion.porcentajeMatch,
      },
      perfil: { ...perfil, user: { nombreCompleto, email, ci, celular } },
    };
  }

  async cambiarEstado(
    userId: number,
    id: number,
    estado: EstadoPostulacion,
    ip: string,
  ) {
    const postulacion = await this.cargarConDuenio(id);
    await this.exigirDuenio(userId, postulacion);
    if (!puedeCambiarPostulacion(postulacion.estado, estado)) {
      throw new BadRequestException(
        `No se puede pasar de ${postulacion.estado} a ${estado}`,
      );
    }
    await this.transicionar(postulacion, estado, userId, ip);
    return { id, estado };
  }

  private cargarConDuenio(id: number) {
    return this.postulaciones
      .findOne({
        where: { id },
        relations: {
          oferta: { empresa: true },
          postulante: { user: true },
        },
      })
      .then((postulacion) => {
        if (!postulacion) {
          throw new NotFoundException('Postulación no encontrada');
        }
        return postulacion;
      });
  }

  private async exigirDuenio(userId: number, postulacion: Postulacion) {
    const empresa = await this.empresas.deUsuario(userId);
    this.empresas.exigirAprobada(empresa);
    if (postulacion.oferta.empresa.id !== empresa.id) {
      throw new NotFoundException('Postulación no encontrada');
    }
  }

  /** Cambia el estado con auditoría y luego avisa al postulante. */
  private async transicionar(
    postulacion: Postulacion,
    nuevo: EstadoPostulacion,
    userId: number,
    ip: string,
  ) {
    const anterior = postulacion.estado;
    postulacion.estado = nuevo;
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Postulacion, postulacion.id, { estado: nuevo });
      await this.audit.log(
        {
          userId,
          accion: AccionAudit.ChangeStatus,
          tabla: 'postulaciones',
          registroId: postulacion.id,
          anteriores: { estado: anterior },
          nuevos: { estado: nuevo },
          ip,
        },
        manager,
      );
    });
    const { titulo } = postulacion.oferta;
    const destino = postulacion.postulante.user.id;
    const opciones = { url: '/postulaciones', whatsapp: true };
    if (nuevo === EstadoPostulacion.Visto) {
      await this.notificaciones.notificar(
        destino,
        'Una empresa vio tu CV',
        `${postulacion.oferta.empresa.razonSocial} revisó tu postulación a "${titulo}".`,
        opciones,
      );
    } else {
      await this.notificaciones.notificar(
        destino,
        'Tu postulación cambió de estado',
        `Tu postulación a "${titulo}" ahora está en: ${NOMBRE_ESTADO_POSTULACION[nuevo]}.`,
        opciones,
      );
    }
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
