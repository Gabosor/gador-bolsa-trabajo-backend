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
  Put,
  Query,
} from '@nestjs/common';
import { Auth, GetUser } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { User } from '../users/entities/user.entity';
import {
  CambiarEstadoOfertaDto,
  FiltroOfertasDto,
  GuardarOfertaDto,
} from './dto/oferta.dto';
import { OfertasService } from './ofertas.service';

@Controller('ofertas')
export class OfertasController {
  constructor(private readonly ofertas: OfertasService) {}

  @Get('mias')
  @Auth(Roles.Empresa)
  misOfertas(@GetUser() user: User, @Query() filtro: FiltroOfertasDto) {
    return this.ofertas.misOfertas(user.id, filtro);
  }

  @Get('mias/:id')
  @Auth(Roles.Empresa)
  miOferta(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ofertas.miOferta(user.id, id);
  }

  @Get('revision')
  @Auth(Roles.SuperAdmin)
  revision(@Query() filtro: FiltroOfertasDto) {
    return this.ofertas.listarRevision(filtro);
  }

  @Post()
  @Auth(Roles.Empresa)
  crear(
    @GetUser() user: User,
    @Body() dto: GuardarOfertaDto,
    @Ip() ip: string,
  ) {
    return this.ofertas.crear(user.id, dto, ip);
  }

  @Put(':id')
  @Auth(Roles.Empresa)
  actualizar(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarOfertaDto,
    @Ip() ip: string,
  ) {
    return this.ofertas.actualizar(user.id, id, dto, ip);
  }

  @Delete(':id')
  @Auth(Roles.Empresa)
  eliminar(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.ofertas.eliminar(user.id, id, ip);
  }

  @Post(':id/duplicar')
  @Auth(Roles.Empresa)
  duplicar(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.ofertas.duplicar(user.id, id, ip);
  }

  @Patch(':id/estado')
  @Auth(Roles.Empresa, Roles.SuperAdmin)
  cambiarEstado(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoOfertaDto,
    @Ip() ip: string,
  ) {
    return this.ofertas.cambiarEstado(user, id, dto, ip);
  }
}
