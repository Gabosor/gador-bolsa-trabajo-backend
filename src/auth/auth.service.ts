import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { AccionAudit, Roles } from '../common/enums';
import { MailService } from '../common/mail.service';
import { PostulanteProfile } from '../postulantes/entities/postulante-profile.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterPostulanteDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const COSTO_BCRYPT = 12;
const MAX_INTENTOS = 5;
const MINUTO = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async registrarPostulante(dto: RegisterPostulanteDto, ip: string) {
    const existe = await this.users.findOne({
      where: [{ email: dto.email }, { ci: dto.ci }],
    });
    if (existe) throw new ConflictException('El email o CI ya está registrado');

    const password = await bcrypt.hash(dto.password, COSTO_BCRYPT);
    const user = await this.dataSource.transaction(async (manager) => {
      const role = await manager
        .getRepository(Role)
        .findOneByOrFail({ nombre: Roles.Postulante });
      const nuevo = await manager.save(
        manager.create(User, { ...dto, password, role }),
      );
      await manager.save(manager.create(PostulanteProfile, { user: nuevo }));
      await this.audit.log(
        {
          userId: nuevo.id,
          accion: AccionAudit.Create,
          tabla: 'users',
          registroId: nuevo.id,
          nuevos: { email: nuevo.email, ci: nuevo.ci, rol: role.nombre },
          ip,
        },
        manager,
      );
      return nuevo;
    });
    return this.generarOtp(user);
  }

  async login(dto: LoginDto, ip: string) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: dto.email })
      .getOne();
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Cuenta bloqueada temporalmente por intentos fallidos',
      );
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      await this.registrarIntentoFallido(user);
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    if (!user.isActive) throw new ForbiddenException('Cuenta desactivada');
    if (!user.phoneVerified) {
      throw new ForbiddenException('Debes verificar tu celular');
    }

    await this.users.update(user.id, { failedAttempts: 0, lockedUntil: null });
    await this.audit.log({
      userId: user.id,
      accion: AccionAudit.Login,
      tabla: 'users',
      registroId: user.id,
      ip,
    });
    return {
      token: await this.jwt.signAsync({ sub: user.id }),
      user: this.datosPublicos(user),
    };
  }

  datosPublicos(user: User) {
    return {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      rol: user.role.nombre,
    };
  }

  async reenviarOtp(email: string) {
    const user = await this.users.findOneBy({ email });
    if (!user || user.phoneVerified) {
      return { mensaje: 'Si la cuenta existe, se envió un código' };
    }
    return this.generarOtp(user);
  }

  async verificarOtp(dto: VerifyOtpDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.otpHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();
    const valido =
      user?.otpHash &&
      user.otpExpiresAt &&
      user.otpExpiresAt > new Date() &&
      (await bcrypt.compare(dto.codigo, user.otpHash));
    if (!valido) throw new BadRequestException('Código inválido o vencido');

    await this.users.update(user.id, {
      phoneVerified: true,
      otpHash: null,
      otpExpiresAt: null,
    });
    return { mensaje: 'Celular verificado' };
  }

  async olvidePassword(email: string) {
    const user = await this.users.findOneBy({ email });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.users.update(user.id, {
        resetTokenHash: await bcrypt.hash(token, COSTO_BCRYPT),
        resetExpiresAt: new Date(Date.now() + 30 * MINUTO),
      });
      const base = this.config.getOrThrow<string>('FRONTEND_URL').split(',')[0];
      const enlace = `${base}/restablecer?email=${encodeURIComponent(email)}&token=${token}`;
      await this.mail.enviar(
        email,
        'Recupera tu contraseña - Bolsa de Trabajo GADOR',
        `Usa este enlace en los próximos 30 minutos: ${enlace}`,
      );
    }
    // Misma respuesta siempre, para no revelar qué correos están registrados.
    return { mensaje: 'Si la cuenta existe, se envió un correo' };
  }

  async restablecerPassword(dto: ResetPasswordDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.resetTokenHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();
    const valido =
      user?.resetTokenHash &&
      user.resetExpiresAt &&
      user.resetExpiresAt > new Date() &&
      (await bcrypt.compare(dto.token, user.resetTokenHash));
    if (!valido) throw new BadRequestException('Enlace inválido o vencido');

    await this.users.update(user.id, {
      password: await bcrypt.hash(dto.password, COSTO_BCRYPT),
      resetTokenHash: null,
      resetExpiresAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    return { mensaje: 'Contraseña actualizada' };
  }

  async cambiarPassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOneOrFail();
    if (!(await bcrypt.compare(dto.actual, user.password))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    await this.users.update(userId, {
      password: await bcrypt.hash(dto.nueva, COSTO_BCRYPT),
    });
    return { mensaje: 'Contraseña actualizada' };
  }

  private async registrarIntentoFallido(user: User) {
    const intentos = user.failedAttempts + 1;
    await this.users.update(
      user.id,
      intentos >= MAX_INTENTOS
        ? {
            failedAttempts: 0,
            lockedUntil: new Date(Date.now() + 15 * MINUTO),
          }
        : { failedAttempts: intentos },
    );
  }

  /** En modo demo el código se devuelve para mostrarlo en pantalla. */
  private async generarOtp(user: User) {
    if (this.config.get('OTP_MODE') !== 'demo') {
      // Punto único para integrar un proveedor SMS.
      throw new ServiceUnavailableException('Proveedor SMS no configurado');
    }
    const codigo = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.users.update(user.id, {
      otpHash: await bcrypt.hash(codigo, COSTO_BCRYPT),
      otpExpiresAt: new Date(Date.now() + 10 * MINUTO),
    });
    return { mensaje: 'Código generado', otpDemo: codigo };
  }
}
