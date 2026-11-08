import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from?: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM');
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = createTransport({
        host,
        port: Number(config.get('SMTP_PORT') ?? 587),
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASSWORD'),
        },
      });
    }
  }

  /** Un correo fallido se registra, pero nunca interrumpe la operación. */
  async enviar(para: string, asunto: string, texto: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`SMTP sin configurar; no se envió: ${asunto}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: para,
        subject: asunto,
        text: texto,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo: ${String(error)}`);
    }
  }
}
