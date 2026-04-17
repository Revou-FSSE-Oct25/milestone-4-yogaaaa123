import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 0. Keamanan Dasar (Helmet & CORS)
  app.use(helmet());
  app.enableCors({
    origin: '*', // Diubah ke domain frontend resmi nanti
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 1. Aktifkan Validasi Global (DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Register Global Prisma Exception Filter supaya tidak ada HTTP 500 mentah ke client
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // 3. Konfigurasi Swagger
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

  // 4. Jalankan Server
  const port = 3000;
  await app.listen(port);

  console.log(`\n🚀 RevoBank API is running on: http://localhost:${port}`);
  console.log(`📖 Swagger Documentation: http://localhost:${port}/api\n`);
}
bootstrap().catch((err) => {
  console.error(err);
});
