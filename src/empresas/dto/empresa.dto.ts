import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { MENSAJE_PASSWORD, PASSWORD_SEGURA } from '../../auth/dto/auth.dto';
import { EstadoEmpresa } from '../../common/enums';
import { PaginationDto } from '../../common/pagination.dto';
import { entre, hasta, normalizarTexto, recortar } from '../../common/texto';

export class RegistrarEmpresaDto {
  @Matches(/^\d{5,20}$/, { message: 'NIT no válido' })
  nit: string;

  @Transform(recortar)
  @IsString()
  @Length(2, 200)
  razonSocial: string;

  @Type(() => Number)
  @IsInt()
  rubroId: number;

  @IsString()
  @Length(3, 150)
  representanteLegal: string;

  @IsString()
  @Length(5, 20)
  ciRepresentante: string;

  @Matches(/^[67]\d{7}$/, { message: 'Celular boliviano no válido' })
  celular: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email no válido' })
  @MaxLength(150)
  emailCorporativo: string;

  @Transform(recortar)
  @IsString()
  @Length(5, 255)
  direccion: string;

  @Transform(normalizarTexto)
  @IsString()
  @Length(10, 3000, entre('La descripción', 10, 3000))
  descripcion: string;

  @Matches(PASSWORD_SEGURA, { message: MENSAJE_PASSWORD })
  password: string;
}

export class FiltroEmpresasDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EstadoEmpresa)
  estado?: EstadoEmpresa;
}

export class CambiarEstadoEmpresaDto {
  @IsEnum(EstadoEmpresa)
  estado: EstadoEmpresa;

  @Transform(recortar)
  @IsOptional()
  @IsString()
  @MaxLength(1000, hasta('El motivo', 1000))
  motivo?: string;
}
