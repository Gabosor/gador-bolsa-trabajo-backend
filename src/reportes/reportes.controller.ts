import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../common/enums';
import { ReporteDto } from './dto/reporte.dto';
import { ReportesService, TipoReporte } from './reportes.service';

const TIPOS_ARCHIVO = {
  excel: {
    extension: 'xlsx',
    contenido:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  pdf: { extension: 'pdf', contenido: 'application/pdf' },
};

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get(':tipo')
  @Auth(Roles.SuperAdmin)
  async descargar(
    @Param('tipo', new ParseEnumPipe(TipoReporte)) tipo: TipoReporte,
    @Query() dto: ReporteDto,
  ) {
    const archivo = TIPOS_ARCHIVO[dto.formato];
    return new StreamableFile(await this.reportes.generar(tipo, dto), {
      type: archivo.contenido,
      disposition: `attachment; filename="reporte-${tipo}.${archivo.extension}"`,
    });
  }
}
