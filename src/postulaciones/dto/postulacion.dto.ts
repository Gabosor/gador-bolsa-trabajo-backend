import { IsEnum } from 'class-validator';
import { EstadoPostulacion } from '../../common/enums';

export class CambiarEstadoPostulacionDto {
  @IsEnum(EstadoPostulacion)
  estado: EstadoPostulacion;
}
