import { Controller, Get } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @Auth(Roles.SuperAdmin)
  resumen() {
    return this.dashboard.resumen();
  }
}
