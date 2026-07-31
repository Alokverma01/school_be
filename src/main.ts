import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Cookie parser
  app.use((cookieParser as any)());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const error = errors.find((e) => e.constraints);
        const firstError =
          error && error.constraints
            ? Object.values(error.constraints)[0]
            : 'Validation failed';

        return new BadRequestException({
          status: false,
          message: firstError,
          error: errors 
        });
      },
    }),
  );
 

  app.useGlobalFilters(new GlobalExceptionFilter());

  const PORT = Number(process.env.PORT) || 7000;
  await app.listen(PORT, '0.0.0.0');
}
bootstrap();