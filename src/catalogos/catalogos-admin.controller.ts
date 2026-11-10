import {
  Body,
  Controller,
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
import { CatalogosAdminService } from './catalogos-admin.service';
import {
  ActualizarCatalogoDto,
  ActualizarHabilidadDto,
  ConfiguracionDto,
  CrearCatalogoDto,
  CrearHabilidadDto,
  ListarCatalogoDto,
} from './dto/admin.dto';

@Controller('admin')
export class CatalogosAdminController {
  constructor(private readonly admin: CatalogosAdminService) {}

  @Get('catalogos')
  @Auth(Roles.SuperAdmin)
  listarCatalogo(@Query() dto: ListarCatalogoDto) {
    return this.admin.listarCatalogo(dto.tipo);
  }

  @Post('catalogos')
  @Auth(Roles.SuperAdmin)
  crearCatalogo(
    @Body() dto: CrearCatalogoDto,
    @GetUser() user: User,
    @Ip() ip: string,
  ) {
    return this.admin.crearCatalogo(dto, { userId: user.id, ip });
  }

  @Patch('catalogos/:id')
  @Auth(Roles.SuperAdmin)
  actualizarCatalogo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCatalogoDto,
    @GetUser() user: User,
    @Ip() ip: string,
  ) {
    return this.admin.actualizarCatalogo(id, dto, { userId: user.id, ip });
  }

  @Get('habilidades')
  @Auth(Roles.SuperAdmin)
  listarHabilidades() {
    return this.admin.listarHabilidades();
  }

  @Post('habilidades')
  @Auth(Roles.SuperAdmin)
  crearHabilidad(
    @Body() dto: CrearHabilidadDto,
    @GetUser() user: User,
    @Ip() ip: string,
  ) {
    return this.admin.crearHabilidad(dto, { userId: user.id, ip });
  }

  @Patch('habilidades/:id')
  @Auth(Roles.SuperAdmin)
  actualizarHabilidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarHabilidadDto,
    @GetUser() user: User,
    @Ip() ip: string,
  ) {
    return this.admin.actualizarHabilidad(id, dto, { userId: user.id, ip });
  }

  @Get('configuracion')
  @Auth(Roles.SuperAdmin)
  obtenerConfiguracion() {
    return this.admin.obtenerConfiguracion();
  }

  @Put('configuracion')
  @Auth(Roles.SuperAdmin)
  guardarConfiguracion(
    @Body() dto: ConfiguracionDto,
    @GetUser() user: User,
    @Ip() ip: string,
  ) {
    return this.admin.guardarConfiguracion(dto, { userId: user.id, ip });
  }
}
