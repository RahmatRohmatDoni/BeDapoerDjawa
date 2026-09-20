import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Helmet untuk security headers
  const helmet = require('helmet');
  app.use(helmet());

  // CORS — izinkan frontend Next.js
  const allowedOrigins = configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map(url => url.trim());
    
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // PERBAIKAN TYPESCRIPT: Menetapkan tipe secara eksplisit menjadi string atau number
  const port: string | number = process.env.PORT || configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 DapoerDjawa Backend running on port ${port}`);
}

bootstrap();