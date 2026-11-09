import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

const PUERTO_TLS_DIRECTO = 465;
const TIEMPO_MAXIMO_MS = 15_000;

const escaparHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Correo con el membrete institucional; todo dato variable se escapa. */
export function plantillaCorreo(
  asunto: string,
  texto: string,
  enlace?: string,
): string {
  const boton = enlace
    ? `<p style="margin:24px 0 0"><a href="${escaparHtml(enlace)}" style="display:inline-block;background:#73141F;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir en la Bolsa de Trabajo</a></p>`
    : '';
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#F1F3F4;font-family:Arial,sans-serif;color:#21252B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#73141F;color:#ffffff;padding:16px 24px"><strong>Gobierno Autónomo Departamental de Oruro</strong><br>Bolsa de Trabajo Departamental Digital</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:20px">${escaparHtml(asunto)}</h1>
<p style="margin:0;font-size:16px;line-height:1.5;white-space:pre-line">${escaparHtml(texto)}</p>${boton}</td></tr>
</table></td></tr></table></body></html>`;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from?: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM');
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      const port = Number(config.get('SMTP_PORT') ?? 587);
      this.transporter = createTransport({
        host,
        port,
        secure: port === PUERTO_TLS_DIRECTO,
        connectionTimeout: TIEMPO_MAXIMO_MS,
        greetingTimeout: TIEMPO_MAXIMO_MS,
        socketTimeout: TIEMPO_MAXIMO_MS,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASSWORD'),
        },
      });
    }
  }

  /** Avisa en el log al arrancar si el servidor de correo no responde. */
  onModuleInit() {
    this.transporter
      ?.verify()
      .then(() => this.logger.log('Servidor de correo disponible'))
      .catch((error) =>
        this.logger.error(`Servidor de correo no disponible: ${String(error)}`),
      );
  }

  /** Un correo fallido se registra, pero nunca interrumpe la operación. */
  async enviar(
    para: string,
    asunto: string,
    texto: string,
    enlace?: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`SMTP sin configurar; no se envió: ${asunto}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: para,
        subject: asunto,
        text: enlace ? `${texto}\n\n${enlace}` : texto,
        html: plantillaCorreo(asunto, texto, enlace),
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo: ${String(error)}`);
    }
  }
}
