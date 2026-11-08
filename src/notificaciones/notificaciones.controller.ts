import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Auth, GetUser } from '../auth/decorators/auth.decorator';
import { User } from '../users/entities/user.entity';
import { SuscripcionDto } from './dto/suscripcion.dto';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  @Auth()
  listar(@GetUser() user: User) {
    return this.notificaciones.listar(user.id);
  }

  @Patch('leidas')
  @Auth()
  marcarLeidas(@GetUser() user: User) {
    return this.notificaciones.marcarLeidas(user.id);
  }

  @Post('suscripcion')
  @Auth()
  suscribir(@GetUser() user: User, @Body() dto: SuscripcionDto) {
    return this.notificaciones.suscribir(user.id, dto);
  }
}
