import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccionAudit } from '../../common/enums';
import { PaginationDto } from '../../common/pagination.dto';

export class ListarAuditoriaDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AccionAudit)
  accion?: AccionAudit;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  tabla?: string;
}
