import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosAdminController } from './catalogos-admin.controller';
import { CatalogosAdminService } from './catalogos-admin.service';
import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';
import { Catalogo } from './entities/catalogo.entity';
import { Configuracion } from './entities/configuracion.entity';
import { Habilidad } from './entities/habilidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Catalogo, Habilidad, Configuracion])],
  controllers: [CatalogosController, CatalogosAdminController],
  providers: [CatalogosService, CatalogosAdminService],
  exports: [CatalogosService, TypeOrmModule],
})
export class CatalogosModule {}
