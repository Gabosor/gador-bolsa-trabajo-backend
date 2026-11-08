import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Favorito } from '../ofertas/entities/favorito.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { User } from '../users/entities/user.entity';
import { Notificacion } from './entities/notificacion.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notificacion,
      PushSubscription,
      User,
      Oferta,
      Favorito,
    ]),
    AuthModule,
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
