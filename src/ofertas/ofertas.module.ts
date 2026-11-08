import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogosModule } from '../catalogos/catalogos.module';
import { Configuracion } from '../catalogos/entities/configuracion.entity';
import { Habilidad } from '../catalogos/entities/habilidad.entity';
import { EmpresasModule } from '../empresas/empresas.module';
import { Postulacion } from '../postulaciones/entities/postulacion.entity';
import { OfertaHabilidad } from './entities/oferta-habilidad.entity';
import { Oferta } from './entities/oferta.entity';
import { OfertasController } from './ofertas.controller';
import { OfertasService } from './ofertas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Oferta,
      OfertaHabilidad,
      Habilidad,
      Configuracion,
      Postulacion,
    ]),
    AuthModule,
    CatalogosModule,
    EmpresasModule,
  ],
  controllers: [OfertasController],
  providers: [OfertasService],
  exports: [OfertasService],
})
export class OfertasModule {}
