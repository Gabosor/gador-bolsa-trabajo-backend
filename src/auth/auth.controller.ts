import { Body, Controller, Get, HttpCode, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { Auth, GetUser } from './decorators/auth.decorator';
import {
  ChangePasswordDto,
  EmailDto,
  LoginDto,
  RegisterPostulanteDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

/** Límite estricto para las rutas expuestas a fuerza bruta. */
const LIMITE_SENSIBLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  @Throttle(LIMITE_SENSIBLE)
  registrar(@Body() dto: RegisterPostulanteDto, @Ip() ip: string) {
    return this.auth.registrarPostulante(dto, ip);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(LIMITE_SENSIBLE)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Post('otp/verificar')
  @HttpCode(200)
  @Throttle(LIMITE_SENSIBLE)
  verificarOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verificarOtp(dto);
  }

  @Post('otp/reenviar')
  @HttpCode(200)
  @Throttle(LIMITE_SENSIBLE)
  reenviarOtp(@Body() dto: EmailDto) {
    return this.auth.reenviarOtp(dto.email);
  }

  @Post('olvide-password')
  @HttpCode(200)
  @Throttle(LIMITE_SENSIBLE)
  olvidePassword(@Body() dto: EmailDto) {
    return this.auth.olvidePassword(dto.email);
  }

  @Post('restablecer-password')
  @HttpCode(200)
  @Throttle(LIMITE_SENSIBLE)
  restablecerPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.restablecerPassword(dto);
  }

  @Post('cambiar-password')
  @HttpCode(200)
  @Auth()
  cambiarPassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.auth.cambiarPassword(user.id, dto);
  }

  @Get('me')
  @Auth()
  me(@GetUser() user: User) {
    return this.auth.datosPublicos(user);
  }
}
