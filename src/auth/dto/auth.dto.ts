import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/** Mínimo 8 caracteres, con mayúscula, minúscula y número. */
export const PASSWORD_SEGURA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
export const MENSAJE_PASSWORD =
  'La contraseña debe tener de 8 a 72 caracteres, con mayúscula, minúscula y número';

const normalizarEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class EmailDto {
  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'Email no válido' })
  @MaxLength(150)
  email: string;
}

export class RegisterPostulanteDto extends EmailDto {
  @IsString()
  @Length(5, 20, { message: 'CI no válido' })
  ci: string;

  @IsString()
  @Length(3, 150)
  nombreCompleto: string;

  @Matches(/^[67]\d{7}$/, { message: 'Celular boliviano no válido' })
  celular: string;

  @Matches(PASSWORD_SEGURA, { message: MENSAJE_PASSWORD })
  password: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyOtpDto extends EmailDto {
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  codigo: string;
}

export class ResetPasswordDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @Matches(PASSWORD_SEGURA, { message: MENSAJE_PASSWORD })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  actual: string;

  @Matches(PASSWORD_SEGURA, { message: MENSAJE_PASSWORD })
  nueva: string;
}
