import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { JsonExceptionFilter } from './common/filters/json-exception.filter';
import helmet from 'helmet';
import { WinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger(),
  });

  app.use(helmet());
  
  // Compression middleware
  const compression = require('compression');
  app.use(compression());
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://revobank.com', 'https://www.revobank.com']
      : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  app.useGlobalFilters(new JsonExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('RevoBank API')
    .setDescription(
      'Dokumentasi API Perbankan untuk Milestone 4 - Yoga Pro Player',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan Token JWT kamu di sini',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const winstonLogger = new WinstonLogger();
  winstonLogger.log(`🚀 RevoBank API is running on port: ${port}`, 'Bootstrap');
  winstonLogger.log(`📖 Swagger Documentation: http://localhost:${port}/api`, 'Bootstrap');
  winstonLogger.log(`🏥 Health Check: http://localhost:${port}/health`, 'Bootstrap');
}
bootstrap().catch((err) => {
  const winstonLogger = new WinstonLogger();
  winstonLogger.error('Failed to start application', err.stack, 'Bootstrap');
});
