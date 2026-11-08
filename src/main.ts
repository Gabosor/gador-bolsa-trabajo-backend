import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const VARIABLES_OBLIGATORIAS = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_NAME',
  'JWT_SECRET',
  'FRONTEND_URL',
];

async function bootstrap() {
  const faltantes = VARIABLES_OBLIGATORIAS.filter((v) => !process.env[v]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Coolify usa un proxy: sin esto, audit_logs guardaría la IP del proxy.
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL!.split(',').map((o) => o.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API en http://localhost:${port}/api`);
}

void bootstrap();
