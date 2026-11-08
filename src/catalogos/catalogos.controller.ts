import { Controller, Get, Param, ParseEnumPipe } from '@nestjs/common';
import { TipoCatalogo } from '../common/enums';
import { CatalogosService } from './catalogos.service';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  @Get('habilidades')
  habilidades() {
    return this.catalogos.listarHabilidades();
  }

  @Get(':tipo')
  listar(@Param('tipo', new ParseEnumPipe(TipoCatalogo)) tipo: TipoCatalogo) {
    return this.catalogos.listar(tipo);
  }
}
