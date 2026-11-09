import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MailService, plantillaCorreo } from './mail.service';

// @nestjs/config se publica como ESM y Jest no lo carga en CommonJS.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn(), verify: jest.fn() })),
}));

const config = (valores: Record<string, string>) =>
  ({ get: (clave: string) => valores[clave] }) as unknown as ConfigService;

describe('MailService', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['465', true],
    ['587', false],
  ])('con el puerto %s usa secure=%s', (puerto, secure) => {
    new MailService(config({ SMTP_HOST: 'smtp.test', SMTP_PORT: puerto }));
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure }),
    );
  });

  it('escapa los datos del usuario en el HTML', () => {
    const html = plantillaCorreo('Aviso', '<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('incluye el enlace solo cuando existe', () => {
    expect(plantillaCorreo('A', 'B', 'https://x.test/y')).toContain(
      'href="https://x.test/y"',
    );
    expect(plantillaCorreo('A', 'B')).not.toContain('href=');
  });
});
