import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { AuditService } from './audit.service';
import { ListarAuditoriaDto } from './dto/auditoria.dto';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Auth(Roles.SuperAdmin)
  listar(@Query() dto: ListarAuditoriaDto) {
    return this.audit.listar(dto);
  }
}
