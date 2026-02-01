import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import { json } from 'express';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use((req, res, next) => {
    if (req.originalUrl === '/stripe/webhook') {
      next();
    } else {
      json()(req, res, next);
    }
  });

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Assemblier backend running on port ${port}`);
}

bootstrap();
