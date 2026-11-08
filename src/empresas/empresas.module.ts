import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogosModule } from '../catalogos/catalogos.module';
import { User } from '../users/entities/user.entity';
import { Empresa } from './entities/empresa.entity';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User]),
    AuthModule,
    CatalogosModule,
  ],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
