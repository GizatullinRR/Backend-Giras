import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

function parseCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return 'http://localhost:4200';
  }
  const list = raw.split(',').map((o) => o.trim()).filter(Boolean);
  if (list.length === 0) {
    return 'http://localhost:4200';
  }
  return list.length === 1 ? list[0]! : list;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: parseCorsOrigins(), credentials: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const port = parseInt(process.env.PORT ?? '3000');
  await app.listen(port);
  console.log(`API listening on port ${port}`);
}
bootstrap();
