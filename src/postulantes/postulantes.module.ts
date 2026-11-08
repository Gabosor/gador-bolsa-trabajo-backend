import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogosModule } from '../catalogos/catalogos.module';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import { Experiencia } from './entities/experiencia.entity';
import { Formacion } from './entities/formacion.entity';
import { PostulanteHabilidad } from './entities/postulante-habilidad.entity';
import { PostulanteProfile } from './entities/postulante-profile.entity';
import { PostulantesController } from './postulantes.controller';
import { PostulantesService } from './postulantes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostulanteProfile,
      Formacion,
      Experiencia,
      PostulanteHabilidad,
      Habilidad,
    ]),
    AuthModule,
    CatalogosModule,
  ],
  controllers: [PostulantesController],
  providers: [PostulantesService],
  exports: [PostulantesService],
})
export class PostulantesModule {}
