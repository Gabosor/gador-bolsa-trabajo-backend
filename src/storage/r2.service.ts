import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const MB = 1024 * 1024;
const PDF = 'application/pdf';
const IMAGENES = ['image/png', 'image/jpeg'];

export const REGLAS_ARCHIVO = {
  cv: { tipos: [PDF], maxBytes: 5 * MB },
  documentos: { tipos: [PDF], maxBytes: 5 * MB },
  fotos: { tipos: IMAGENES, maxBytes: 2 * MB },
  logos: { tipos: IMAGENES, maxBytes: 2 * MB },
};

export type CarpetaArchivo = keyof typeof REGLAS_ARCHIVO;

const EXTENSIONES: Record<string, string> = {
  [PDF]: 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** Comprueba el tipo real mirando los primeros bytes, no el nombre del archivo. */
export function coincideTipoReal(tipo: string, contenido: Buffer): boolean {
  const firma = (hex: string) =>
    contenido.subarray(0, hex.length / 2).toString('hex') === hex;
  if (tipo === PDF) return firma('25504446'); // %PDF
  if (tipo === 'image/png') return firma('89504e47');
  if (tipo === 'image/jpeg') return firma('ffd8ff');
  return false;
}

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucket?: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('R2_BUCKET');
    // Acepta el id de la cuenta o la URL completa del endpoint de Cloudflare.
    const cuenta = config.get<string>('R2_ACCOUNT_ID') ?? '';
    this.client = new S3Client({
      region: 'auto',
      endpoint: cuenta.startsWith('http')
        ? cuenta
        : `https://${cuenta}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  /** Valida y sube el archivo. Devuelve la clave que se guarda en la BD. */
  async upload(
    carpeta: CarpetaArchivo,
    archivo: Express.Multer.File | undefined,
  ): Promise<string> {
    if (!archivo) throw new BadRequestException('Falta el archivo');
    const regla = REGLAS_ARCHIVO[carpeta];
    if (
      !regla.tipos.includes(archivo.mimetype) ||
      !coincideTipoReal(archivo.mimetype, archivo.buffer)
    ) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (archivo.size > regla.maxBytes) {
      throw new BadRequestException(
        `El archivo supera ${regla.maxBytes / MB} MB`,
      );
    }
    const key = `${carpeta}/${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketConfigurado(),
        Key: key,
        Body: archivo.buffer,
        ContentType: archivo.mimetype,
      }),
    );
    return key;
  }

  /** URL temporal para ver o descargar un archivo del bucket privado. */
  getSignedUrl(key: string, segundos = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucketConfigurado(), Key: key }),
      { expiresIn: segundos },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucketConfigurado(), Key: key }),
    );
  }

  private bucketConfigurado(): string {
    if (!this.bucket) {
      throw new ServiceUnavailableException('Almacenamiento no configurado');
    }
    return this.bucket;
  }
}
