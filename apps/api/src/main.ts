import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { apiV1Rewrite, requestContextMiddleware } from './common/request-context';
import { assertDataProviderPolicy } from './config/provider-policy';

async function bootstrap() {
  assertDataProviderPolicy();
  const app = await NestFactory.create(AppModule);
  app.use(requestContextMiddleware);
  app.use(apiV1Rewrite);
  app.use(helmet());
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: origin.trim() === '*' ? true : origin.split(',').map((item) => item.trim()),
    credentials: origin.trim() !== '*',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('BMU Student API')
      .setDescription(
        'Demo REST API for the BMU Student App. Data comes from MockBMUDataProvider unless an official provider is configured. This is not connected to Baku Engineering University systems. Paths under /api/v1 use the same handlers as the unversioned routes. Production refuses to boot unless BMU_DATA_PROVIDER=official.',
      )
      .setVersion('0.2.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Bootstrap failed';
  if (process.env.NODE_ENV === 'production') console.error(message);
  else console.error(error);
  process.exit(1);
});
