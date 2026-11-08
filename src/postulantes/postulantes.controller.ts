import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, GetUser } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { User } from '../users/entities/user.entity';
import {
  DatosPersonalesDto,
  ExperienciaDto,
  FormacionDto,
  HabilidadesPerfilDto,
} from './dto/perfil.dto';
import { PostulantesService } from './postulantes.service';

const LIMITE_ARCHIVO = { limits: { fileSize: 5 * 1024 * 1024 } };

@Controller('postulantes/perfil')
export class PostulantesController {
  constructor(private readonly postulantes: PostulantesService) {}

  @Get()
  @Auth(Roles.Postulante)
  miPerfil(@GetUser() user: User) {
    return this.postulantes.miPerfil(user.id);
  }

  @Put('datos')
  @Auth(Roles.Postulante)
  datos(
    @GetUser() user: User,
    @Body() dto: DatosPersonalesDto,
    @Ip() ip: string,
  ) {
    return this.postulantes.actualizarDatos(user.id, dto, ip);
  }

  @Post('cv')
  @Auth(Roles.Postulante)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_ARCHIVO))
  cv(
    @GetUser() user: User,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Ip() ip: string,
  ) {
    return this.postulantes.subirArchivo(user.id, 'cv', archivo, ip);
  }

  @Post('foto')
  @Auth(Roles.Postulante)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_ARCHIVO))
  foto(
    @GetUser() user: User,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Ip() ip: string,
  ) {
    return this.postulantes.subirArchivo(user.id, 'fotos', archivo, ip);
  }

  @Post('formaciones')
  @Auth(Roles.Postulante)
  agregarFormacion(
    @GetUser() user: User,
    @Body() dto: FormacionDto,
    @Ip() ip: string,
  ) {
    return this.postulantes.agregarFormacion(user.id, dto, ip);
  }

  @Delete('formaciones/:id')
  @Auth(Roles.Postulante)
  eliminarFormacion(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.postulantes.eliminarFormacion(user.id, id, ip);
  }

  @Post('experiencias')
  @Auth(Roles.Postulante)
  agregarExperiencia(
    @GetUser() user: User,
    @Body() dto: ExperienciaDto,
    @Ip() ip: string,
  ) {
    return this.postulantes.agregarExperiencia(user.id, dto, ip);
  }

  @Delete('experiencias/:id')
  @Auth(Roles.Postulante)
  eliminarExperiencia(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.postulantes.eliminarExperiencia(user.id, id, ip);
  }

  @Put('habilidades')
  @Auth(Roles.Postulante)
  habilidades(
    @GetUser() user: User,
    @Body() dto: HabilidadesPerfilDto,
    @Ip() ip: string,
  ) {
    return this.postulantes.guardarHabilidades(user.id, dto, ip);
  }
}
