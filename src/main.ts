import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

import { AppModule } from './app.module';
const bootstrap = async () => {
    const app = await NestFactory.create(AppModule, {});
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.useGlobalPipes(new I18nValidationPipe());

    app.useGlobalFilters(
        new I18nValidationExceptionFilter({
            detailedErrors: false,
        }),
    );
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Account management API')
        .setDescription('Project for account management')
        .setVersion('1.0')
        .addTag('account-management')
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
        })
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);
    console.log(`Application is running on: ${await app.getUrl()}`);
};

(async () => {
    await bootstrap();
})();
