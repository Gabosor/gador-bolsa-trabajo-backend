import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthModule } from './auth/auth.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { CommonModule } from './common/common.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OfertasModule } from './ofertas/ofertas.module';
import { PostulacionesModule } from './postulaciones/postulaciones.module';
import { PostulantesModule } from './postulantes/postulantes.module';
import { dataSourceOptions } from './database/data-source';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    TypeOrmModule.forRoot(dataSourceOptions),
    CommonModule,
    AuditoriaModule,
    NotificacionesModule,
    AuthModule,
    CatalogosModule,
    EmpresasModule,
    OfertasModule,
    PostulantesModule,
    PostulacionesModule,
    DashboardModule,
    ReportesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
