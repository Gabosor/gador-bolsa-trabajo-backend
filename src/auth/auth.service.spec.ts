import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../auditoria/audit.service';
import { MailService } from '../common/mail.service';
import { WhatsappService } from '../common/whatsapp.service';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterPostulanteDto } from './dto/auth.dto';

// Estos paquetes se publican como ESM y Jest no los carga en CommonJS.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const MINUTO = 60_000;
const dto: RegisterPostulanteDto = {
  email: 'a@b.bo',
  ci: '123456',
  nombreCompleto: 'Ana Pérez',
  celular: '71234567',
  password: 'Secreta123',
};

function preparar(modo: 'demo' | 'whatsapp') {
  const getOne = jest.fn();
  const users = {
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: () => ({
      addSelect: () => ({ where: () => ({ getOne }) }),
    }),
  };
  const transaction = jest.fn();
  const enviar = jest.fn().mockResolvedValue(undefined);
  const service = new AuthService(
    users as unknown as Repository<User>,
    { transaction } as unknown as DataSource,
    {} as JwtService,
    {} as AuditService,
    {} as MailService,
    { enviar } as unknown as WhatsappService,
    { get: () => modo } as unknown as ConfigService,
  );
  return { service, users, getOne, transaction, enviar };
}

const pendiente = (haceMs: number) =>
  ({
    id: 1,
    celular: '71234567',
    phoneVerified: false,
    otpIntentos: 0,
    otpExpiresAt: new Date(Date.now() + 10 * MINUTO - haceMs),
  }) as User;

describe('OTP en AuthService', () => {
  it('no crea la cuenta si el envío falla', async () => {
    const { service, transaction, enviar } = preparar('whatsapp');
    enviar.mockRejectedValue(new BadRequestException('sin WhatsApp'));

    await expect(service.registrarPostulante(dto, 'ip')).rejects.toThrow(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('en modo WhatsApp no devuelve el código', async () => {
    const { service, enviar } = preparar('whatsapp');
    const respuesta = await service.registrarPostulante(dto, 'ip');

    expect(respuesta).not.toHaveProperty('otpDemo');
    expect(enviar).toHaveBeenCalledWith('71234567', expect.any(String));
  });

  it('en modo demo muestra el código y no envía nada', async () => {
    const { service, enviar } = preparar('demo');
    const respuesta = await service.registrarPostulante(dto, 'ip');

    expect(respuesta.otpDemo).toMatch(/^\d{6}$/);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('respeta la espera antes de reenviar', async () => {
    const { service, users, enviar } = preparar('whatsapp');
    users.findOneBy.mockResolvedValue(pendiente(5_000));

    await service.reenviarOtp(dto.email);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('reenvía tras la espera y reinicia los intentos', async () => {
    const { service, users, enviar } = preparar('whatsapp');
    users.findOneBy.mockResolvedValue(pendiente(31_000));

    await service.reenviarOtp(dto.email);
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(users.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ otpIntentos: 0 }),
    );
  });

  it('un reenvío fallido no consume la espera', async () => {
    const { service, users, enviar } = preparar('whatsapp');
    users.findOneBy.mockResolvedValue(pendiente(31_000));
    enviar.mockRejectedValue(new Error('caído'));

    await expect(service.reenviarOtp(dto.email)).rejects.toThrow('caído');
    expect(users.update).not.toHaveBeenCalled();
  });

  describe('verificarOtp', () => {
    let otpHash: string;
    beforeAll(async () => {
      otpHash = await bcrypt.hash('123456', 4);
    });

    const conCodigo = (otpIntentos: number) =>
      ({ ...pendiente(0), otpHash, otpIntentos }) as User;

    it('cuenta un intento fallido', async () => {
      const { service, users, getOne } = preparar('whatsapp');
      getOne.mockResolvedValue(conCodigo(1));

      await expect(
        service.verificarOtp({ email: dto.email, codigo: '000000' }),
      ).rejects.toThrow(BadRequestException);
      expect(users.update).toHaveBeenCalledWith(1, { otpIntentos: 2 });
    });

    it('anula el código al quinto fallo', async () => {
      const { service, users, getOne } = preparar('whatsapp');
      getOne.mockResolvedValue(conCodigo(4));

      await expect(
        service.verificarOtp({ email: dto.email, codigo: '000000' }),
      ).rejects.toThrow(BadRequestException);
      expect(users.update).toHaveBeenCalledWith(1, {
        otpHash: null,
        otpIntentos: 0,
      });
    });

    it('verifica con el código correcto', async () => {
      const { service, users, getOne } = preparar('whatsapp');
      getOne.mockResolvedValue(conCodigo(2));

      await service.verificarOtp({ email: dto.email, codigo: '123456' });
      expect(users.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ phoneVerified: true, otpIntentos: 0 }),
      );
    });
  });
});
