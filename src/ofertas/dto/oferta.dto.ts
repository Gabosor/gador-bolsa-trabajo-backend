import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EstadoOferta, NivelHabilidad } from '../../common/enums';
import { PaginationDto } from '../../common/pagination.dto';

export class HabilidadOfertaDto {
  @IsInt()
  habilidadId: number;

  @IsBoolean()
  obligatoria: boolean;

  @IsEnum(NivelHabilidad)
  nivelMinimo: NivelHabilidad;
}

export class GuardarOfertaDto {
  @IsString()
  @Length(3, 150)
  titulo: string;

  @IsString()
  @Length(10, 10000)
  descripcion: string;

  @IsString()
  @Length(3, 5000)
  requisitosObligatorios: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  requisitosDeseables?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos una profesión' })
  @IsInt({ each: true })
  profesionIds: number[];

  @IsInt()
  @Min(0)
  aniosExperiencia: number;

  @IsInt()
  tipoContratoId: number;

  @IsInt()
  modalidadId: number;

  @IsInt()
  municipioId: number;

  @IsBoolean()
  salarioATratar: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  salarioMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  salarioMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  beneficios?: string;

  @IsDateString({ strict: true }, { message: 'Fecha de cierre no válida' })
  fechaCierre: string;

  @IsInt()
  @Min(1)
  numeroPlazas: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos una habilidad' })
  @ValidateNested({ each: true })
  @Type(() => HabilidadOfertaDto)
  habilidades: HabilidadOfertaDto[];
}

export class CambiarEstadoOfertaDto {
  @IsEnum(EstadoOferta)
  estado: EstadoOferta;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivo?: string;
}

/** Filtros del buscador público (RF03). */
export class BuscarOfertasDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profesionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  municipioId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modalidadId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salarioMin?: number;
}

export class FiltroOfertasDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EstadoOferta)
  estado?: EstadoOferta;
}
