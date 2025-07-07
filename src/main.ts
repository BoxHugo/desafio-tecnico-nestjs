import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@shared/interceptors/http-exception.filter';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { WinstonLogger } from '@infrastructure/logging/winston.logger';
import helmet from 'helmet';

async function bootstrap() {
  const versionApi = 'v1';
  const app = await NestFactory.create(AppModule, { logger: WinstonLogger });
  const bootstrapLogger = new Logger('Bootstrap');

  app.setGlobalPrefix(versionApi);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());

  const config = new DocumentBuilder()
    .setTitle('Gerenciador de Usuários')
    .setDescription('CRUD - Desafio técnico NestJs')
    .setVersion('1.0')
    .addTag('users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token no formato: Bearer <token>',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(`${versionApi}/doc`, app, document);

  await app.listen(process.env.PORT!);
  bootstrapLogger.log(`Application is running on port: ${process.env.PORT!}`);
}

bootstrap();
