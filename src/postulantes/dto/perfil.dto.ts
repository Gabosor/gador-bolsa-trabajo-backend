import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { NivelHabilidad } from '../../common/enums';

export class IdiomaDto {
  @IsString()
  @Length(2, 40)
  nombre: string;

  @IsString()
  @Length(2, 40)
  nivel: string;
}

export class DatosPersonalesDto {
  @IsString()
  @Length(5, 255)
  direccion: string;

  @IsDateString({ strict: true }, { message: 'Fecha de nacimiento no válida' })
  fechaNacimiento: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdiomaDto)
  idiomas: IdiomaDto[];
}

export class FormacionDto {
  @IsInt()
  profesionId: number;

  @IsString()
  @Length(2, 150)
  institucion: string;

  @IsInt()
  @Min(1950)
  @Max(2100)
  anioTitulacion: number;

  @IsString()
  @Length(1, 50)
  nroTituloNacional: string;
}

export class ExperienciaDto {
  @IsString()
  @Length(2, 150)
  empresa: string;

  @IsString()
  @Length(2, 120)
  cargo: string;

  @IsInt()
  @Min(0)
  @Max(60)
  anios: number;

  @IsString()
  @Length(5, 3000)
  descripcion: string;
}

export class HabilidadPerfilDto {
  @IsInt()
  habilidadId: number;

  @IsEnum(NivelHabilidad)
  nivel: NivelHabilidad;
}

export class HabilidadesPerfilDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabilidadPerfilDto)
  habilidades: HabilidadPerfilDto[];
}
