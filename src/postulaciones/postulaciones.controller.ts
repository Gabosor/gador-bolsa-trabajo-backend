import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CambiarEstadoPostulacionDto } from './dto/postulacion.dto';
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

  @Get('oferta/:ofertaId')
  @Auth(Roles.Empresa)
  postulantesDeOferta(
    @GetUser() user: User,
    @Param('ofertaId', ParseIntPipe) ofertaId: number,
  ) {
    return this.postulaciones.postulantesDeOferta(user.id, ofertaId);
  }

  @Get(':id/perfil')
  @Auth(Roles.Empresa, Roles.SuperAdmin)
  verPerfil(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.postulaciones.verPerfil(user, id, ip);
  }

  @Patch(':id/estado')
  @Auth(Roles.Empresa)
  cambiarEstado(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoPostulacionDto,
    @Ip() ip: string,
  ) {
    return this.postulaciones.cambiarEstado(user.id, id, dto.estado, ip);
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
