import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { TipoCatalogo } from '../../common/enums';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListarCatalogoDto {
  @IsEnum(TipoCatalogo)
  tipo: TipoCatalogo;
}

export class CrearCatalogoDto {
  @IsEnum(TipoCatalogo)
  tipo: TipoCatalogo;

  @Transform(recortar)
  @IsString()
  @Length(2, 120)
  nombre: string;

  /** Obligatorio solo para municipios: id del departamento. */
  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class CrearHabilidadDto {
  @Transform(recortar)
  @IsString()
  @Length(1, 80)
  nombre: string;
}

export class ActualizarItemDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @Length(1, 120)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ConfiguracionDto {
  @IsInt()
  @Min(1)
  @Max(100)
  limiteOfertasActivas: number;
}
