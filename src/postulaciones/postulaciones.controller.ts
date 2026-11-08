import {
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Auth, GetUser } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { PaginationDto } from '../common/pagination.dto';
import { User } from '../users/entities/user.entity';
import { PostulacionesService } from './postulaciones.service';

@Controller('postulaciones')
export class PostulacionesController {
  constructor(private readonly postulaciones: PostulacionesService) {}

  @Get('mias')
  @Auth(Roles.Postulante)
  mias(@GetUser() user: User, @Query() filtro: PaginationDto) {
    return this.postulaciones.misPostulaciones(user.id, filtro);
  }

  @Get('favoritos')
  @Auth(Roles.Postulante)
  favoritos(@GetUser() user: User) {
    return this.postulaciones.misFavoritos(user.id);
  }

  @Post('favoritos/:ofertaId')
  @Auth(Roles.Postulante)
  agregarFavorito(
    @GetUser() user: User,
    @Param('ofertaId', ParseIntPipe) ofertaId: number,
  ) {
    return this.postulaciones.agregarFavorito(user.id, ofertaId);
  }

  @Delete('favoritos/:ofertaId')
  @Auth(Roles.Postulante)
  quitarFavorito(
    @GetUser() user: User,
    @Param('ofertaId', ParseIntPipe) ofertaId: number,
  ) {
    return this.postulaciones.quitarFavorito(user.id, ofertaId);
  }

  @Post('oferta/:ofertaId')
  @Auth(Roles.Postulante)
  postular(
    @GetUser() user: User,
    @Param('ofertaId', ParseIntPipe) ofertaId: number,
    @Ip() ip: string,
  ) {
    return this.postulaciones.postular(user.id, ofertaId, ip);
  }

  @Delete(':id')
  @Auth(Roles.Postulante)
  retirar(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.postulaciones.retirar(user.id, id, ip);
  }
}
