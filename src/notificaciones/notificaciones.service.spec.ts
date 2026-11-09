import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MailService } from '../common/mail.service';
import { WhatsappService } from '../common/whatsapp.service';
import { Favorito } from '../ofertas/entities/favorito.entity';
import { Oferta } from '../ofertas/entities/oferta.entity';
import { User } from '../users/entities/user.entity';
import { Notificacion } from './entities/notificacion.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificacionesService } from './notificaciones.service';

// Estos paquetes se publican como ESM y Jest no los carga en CommonJS.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('web-push', () => ({ setVapidDetails: jest.fn() }));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const usuario = { id: 1, email: 'a@test.bo', celular: '70000000' } as User;

function preparar() {
  const correo = jest.fn().mockResolvedValue(undefined);
  const whatsapp = jest.fn().mockResolvedValue(undefined);
  const config = {
    get: (clave: string) =>
      clave === 'FRONTEND_URL'
        ? 'https://app.test,https://otra.test'
        : undefined,
  } as unknown as ConfigService;
  const service = new NotificacionesService(
    {} as Repository<Notificacion>,
    {} as Repository<PushSubscription>,
    {} as Repository<User>,
    {} as Repository<Oferta>,
    {} as Repository<Favorito>,
    { enviar: correo } as unknown as MailService,
    { enviar: whatsapp } as unknown as WhatsappService,
    config,
  );
  return { service, correo, whatsapp };
}

describe('NotificacionesService.despachar', () => {
  it('envía por WhatsApp los avisos personales, con enlace absoluto', async () => {
    const { service, correo, whatsapp } = preparar();
    await service.despachar(
      usuario,
      'Título',
      'Mensaje',
      '/postulaciones',
      true,
    );
    const enlace = 'https://app.test/postulaciones';
    expect(correo).toHaveBeenCalledWith(
      usuario.email,
      'Título',
      'Mensaje',
      enlace,
    );
    expect(whatsapp).toHaveBeenCalledWith(
      usuario.celular,
      expect.stringContaining(enlace),
    );
  });

  it('no usa WhatsApp en los avisos masivos', async () => {
    const { service, correo, whatsapp } = preparar();
    await service.despachar(usuario, 'Título', 'Mensaje', '/ofertas/1', false);
    expect(correo).toHaveBeenCalled();
    expect(whatsapp).not.toHaveBeenCalled();
  });

  it('un fallo de WhatsApp no impide el correo ni lanza errores', async () => {
    const { service, correo, whatsapp } = preparar();
    whatsapp.mockRejectedValue(new Error('caído'));
    await expect(
      service.despachar(usuario, 'Título', 'Mensaje', undefined, true),
    ).resolves.toBeUndefined();
    expect(correo).toHaveBeenCalled();
  });
});
