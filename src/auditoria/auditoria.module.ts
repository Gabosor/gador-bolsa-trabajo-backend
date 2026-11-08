import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuditService } from './audit.service';
import { AuditoriaController } from './auditoria.controller';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User])],
  controllers: [AuditoriaController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditoriaModule {}
