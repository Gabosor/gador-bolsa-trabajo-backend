import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { EstadoOferta } from '../common/enums';
import { mananaBolivia } from '../common/fechas';
import { MailService } from '../common/mail.service';
import { WhatsappService } from '../common/whatsapp.service';
import { Favorito } from '../ofertas/entities/favorito.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { Formacion } from '../postulantes/entities/formacion.entity';
import { PostulanteProfile } from '../postulantes/entities/postulante-profile.entity';
import { User } from '../users/entities/user.entity';
import { SuscripcionDto } from './dto/suscripcion.dto';
import { Notificacion } from './entities/notificacion.entity';
import { PushSubscription } from './entities/push-subscription.entity';

export interface OpcionesAviso {
  url?: string;
  /** Solo avisos personales: los masivos arriesgan el bloqueo del número. */
  whatsapp?: boolean;
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly pushActivo: boolean;
  private readonly baseFrontend: string;

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificaciones: Repository<Notificacion>,
    @InjectRepository(PushSubscription)
    private readonly suscripciones: Repository<PushSubscription>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(Favorito)
    private readonly favoritos: Repository<Favorito>,
    private readonly mail: MailService,
    private readonly whatsapp: WhatsappService,
    config: ConfigService,
  ) {
    this.baseFrontend = (config.get<string>('FRONTEND_URL') ?? '').split(
      ',',
    )[0];
    const publica = config.get<string>('VAPID_PUBLIC_KEY');
    const privada = config.get<string>('VAPID_PRIVATE_KEY');
    const sujeto = config.get<string>('VAPID_SUBJECT');
    this.pushActivo = Boolean(publica && privada && sujeto);
    if (this.pushActivo) {
      webpush.setVapidDetails(sujeto!, publica!, privada!);
    }
  }

  /**
   * Guarda el aviso y lo envía por los canales externos sin esperarlos, para
   * que un servidor lento no demore la operación. Nunca lanza errores.
   */
  async notificar(
    userId: number,
    titulo: string,
    mensaje: string,
    { url, whatsapp = false }: OpcionesAviso = {},
  ) {
    try {
      const user = await this.users.findOneBy({ id: userId });
      if (!user) return;
      await this.notificaciones.save(
        this.notificaciones.create({ user, titulo, mensaje }),
      );
      void this.despachar(user, titulo, mensaje, url, whatsapp);
    } catch (error) {
      this.logger.error(`No se pudo notificar: ${String(error)}`);
    }
  }

  /** Un canal caído no impide que los demás entreguen el aviso. */
  async despachar(
    user: User,
    titulo: string,
    mensaje: string,
    url: string | undefined,
    whatsapp: boolean,
  ) {
    const enlace = url ? `${this.baseFrontend}${url}` : undefined;
    const resultados = await Promise.allSettled([
      this.mail.enviar(user.email, titulo, mensaje, enlace),
      this.enviarPush(user.id, titulo, mensaje, url),
      whatsapp
        ? this.whatsapp.enviar(
            user.celular,
            [`*${titulo}*`, mensaje, enlace].filter(Boolean).join('\n\n'),
          )
        : Promise.resolve(),
    ]);
    for (const resultado of resultados) {
      if (resultado.status === 'rejected') {
        this.logger.error(`Canal de aviso: ${String(resultado.reason)}`);
      }
    }
  }

  /** Avisa a quienes tienen una profesión pedida por la oferta (RF12). */
  async avisarNuevaOferta(ofertaId: number, titulo: string) {
    try {
      const filas = await this.users
        .createQueryBuilder('u')
        .select('DISTINCT u.id', 'id')
        .innerJoin(PostulanteProfile, 'p', 'p.user_id = u.id')
        .innerJoin(Formacion, 'f', 'f.profile_id = p.id')
        .innerJoin('oferta_profesion', 'op', 'op.profesion_id = f.profesion_id')
        .where('op.oferta_id = :ofertaId', { ofertaId })
        .getRawMany<{ id: number }>();
      for (const fila of filas) {
        await this.notificar(
          fila.id,
          'Nueva oferta de tu profesión',
          `Se publicó la oferta "${titulo}".`,
          { url: `/ofertas/${ofertaId}` },
        );
      }
    } catch (error) {
      this.logger.error(`Aviso de nueva oferta: ${String(error)}`);
    }
  }

  /** Cada hora avisa de las ofertas que cierran mañana, una sola vez (RF12). */
  @Cron(CronExpression.EVERY_HOUR)
  async avisarVencimientos() {
    const porVencer = await this.ofertas.find({
      where: {
        estado: EstadoOferta.Publicada,
        fechaCierre: mananaBolivia(),
        avisoCierreEnviado: false,
      },
      relations: { empresa: { user: true } },
    });
    for (const oferta of porVencer) {
      await this.ofertas.update(oferta.id, { avisoCierreEnviado: true });
      const titulo = 'Oferta por vencer';
      const mensaje = `La oferta "${oferta.titulo}" cierra en menos de 24 horas.`;
      await this.notificar(oferta.empresa.user.id, titulo, mensaje, {
        url: '/empresa/ofertas',
        whatsapp: true,
      });
      const guardados = await this.favoritos.find({
        where: { oferta: { id: oferta.id } },
        relations: { profile: { user: true } },
      });
      for (const favorito of guardados) {
        await this.notificar(favorito.profile.user.id, titulo, mensaje, {
          url: `/ofertas/${oferta.id}`,
          whatsapp: true,
        });
      }
    }
  }

  listar(userId: number) {
    return this.notificaciones.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async marcarLeidas(userId: number) {
    await this.notificaciones.update(
      { user: { id: userId }, leida: false },
      { leida: true },
    );
    return { mensaje: 'Notificaciones leídas' };
  }

  async suscribir(userId: number, dto: SuscripcionDto) {
    await this.suscripciones.upsert(
      {
        user: { id: userId },
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      ['endpoint'],
    );
    return { mensaje: 'Notificaciones activadas' };
  }

  private async enviarPush(
    userId: number,
    titulo: string,
    mensaje: string,
    url?: string,
  ) {
    if (!this.pushActivo) return;
    const destinos = await this.suscripciones.findBy({ user: { id: userId } });
    await Promise.all(
      destinos.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ titulo, mensaje, url }),
          );
        } catch (error) {
          // 404 y 410: el navegador canceló la suscripción.
          const codigo = (error as { statusCode?: number }).statusCode;
          if (codigo === 404 || codigo === 410) {
            await this.suscripciones.delete(s.id);
          }
        }
      }),
    );
  }
}
