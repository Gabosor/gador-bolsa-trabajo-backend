import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Auth, GetUser } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { User } from '../users/entities/user.entity';
import {
  CambiarEstadoEmpresaDto,
  FiltroEmpresasDto,
  RegistrarEmpresaDto,
} from './dto/empresa.dto';
import type { ArchivosEmpresa } from './empresas.service';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresas: EmpresasService) {}

  @Post('registro')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'documentoNit', maxCount: 1 },
        { name: 'documentoLegal', maxCount: 1 },
      ],
      { limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  registrar(
    @Body() dto: RegistrarEmpresaDto,
    @UploadedFiles() archivos: ArchivosEmpresa | undefined,
    @Ip() ip: string,
  ) {
    return this.empresas.registrar(dto, archivos ?? {}, ip);
  }

  @Get('mi-empresa')
  @Auth(Roles.Empresa)
  miEmpresa(@GetUser() user: User) {
    return this.empresas.miEmpresa(user.id);
  }

  @Get()
  @Auth(Roles.SuperAdmin)
  listar(@Query() filtro: FiltroEmpresasDto) {
    return this.empresas.listar(filtro);
  }

  @Get(':id')
  @Auth(Roles.SuperAdmin)
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.empresas.detalle(id);
  }

  @Patch(':id/estado')
  @Auth(Roles.SuperAdmin)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoEmpresaDto,
    @GetUser() admin: User,
    @Ip() ip: string,
  ) {
    return this.empresas.cambiarEstado(id, dto, admin.id, ip);
  }
}
