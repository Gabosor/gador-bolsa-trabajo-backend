import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EmpresasModule } from '../empresas/empresas.module';
import { Favorito } from '../ofertas/entities/favorito.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { PostulantesModule } from '../postulantes/postulantes.module';
import { Postulacion } from './entities/postulacion.entity';
import { PostulacionesController } from './postulaciones.controller';
import { PostulacionesService } from './postulaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Postulacion, Oferta, Favorito]),
    AuthModule,
    EmpresasModule,
    PostulantesModule,
  ],
  controllers: [PostulacionesController],
  providers: [PostulacionesService],
})
export class PostulacionesModule {}
