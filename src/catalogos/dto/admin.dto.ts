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
import { recortar } from '../../common/texto';

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

  /** Municipio: id del departamento (obligatorio). Profesión: id del área (opcional). */
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

export class CrearHabilidadDto {
  @Transform(recortar)
  @IsString()
  @Length(1, 80)
  nombre: string;

  /** Sin área, la habilidad es general. */
  @IsOptional()
  @IsInt()
  areaId?: number | null;
}

export class ActualizarCatalogoDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @Length(2, 120)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  /** null quita el área de una profesión. */
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

export class ActualizarHabilidadDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @Length(1, 80, { message: 'El nombre admite hasta 80 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  /** null deja la habilidad como general. */
  @IsOptional()
  @IsInt()
  areaId?: number | null;
}

export class ConfiguracionDto {
  @IsInt()
  @Min(1)
  @Max(100)
  limiteOfertasActivas: number;
}
