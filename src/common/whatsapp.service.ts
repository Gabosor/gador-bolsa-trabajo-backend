import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CODIGO_PAIS = '591';
const TIEMPO_MAXIMO_MS = 10_000;
const MENSAJE_NO_DISPONIBLE =
  'No pudimos enviar el código por WhatsApp. Intenta de nuevo en unos minutos.';

/** Envía mensajes por WhatsApp mediante Evolution API v2. */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly url?: string;
  private readonly apiKey?: string;
  private readonly instancia?: string;

  constructor(config: ConfigService) {
    this.url = config.get<string>('EVOLUTION_API_URL')?.replace(/\/+$/, '');
    this.apiKey = config.get<string>('EVOLUTION_API_KEY');
    this.instancia = config.get<string>('EVOLUTION_INSTANCE');
  }

  /** A diferencia del correo, un fallo aquí sí detiene la operación. */
  async enviar(celular: string, texto: string): Promise<void> {
    if (!this.url || !this.apiKey || !this.instancia) {
      this.logger.error('Evolution API sin configurar');
      throw new ServiceUnavailableException(MENSAJE_NO_DISPONIBLE);
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(
        `${this.url}/message/sendText/${encodeURIComponent(this.instancia)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            number: `${CODIGO_PAIS}${celular}`,
            text: texto,
          }),
          signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
        },
      );
    } catch (error) {
      this.logger.error(`Evolution API no responde: ${String(error)}`);
      throw new ServiceUnavailableException(MENSAJE_NO_DISPONIBLE);
    }

    if (respuesta.ok) return;

    // Evolution también responde 400 ante otros errores de la petición.
    if (
      respuesta.status === 400 &&
      /"exists"\s*:\s*false/.test(await respuesta.text())
    ) {
      throw new BadRequestException('Ese número no tiene WhatsApp');
    }
    this.logger.error(`Evolution API respondió ${respuesta.status}`);
    throw new ServiceUnavailableException(MENSAJE_NO_DISPONIBLE);
  }
}
