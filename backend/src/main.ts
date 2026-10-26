import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { jwtSecret } from './auth/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Fail fast instead of signing tokens with the development secret
  jwtSecret();

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const origins =
    process.env.NODE_ENV === 'production'
      ? [frontendUrl]
      : [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Certificado PDFs are not served publicly: use GET /api/certificados/:id/pdf
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
