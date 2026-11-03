import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
    app.enableCors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Nexo Assist API').setVersion('1.0').addBearerAuth().build());
    SwaggerModule.setup('docs', app, doc);
    await app.listen(Number(process.env.PORT || 3001));
}
bootstrap();
