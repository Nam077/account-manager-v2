import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule, MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { I18nService } from 'nestjs-i18n';
import path from 'path';
@Injectable()
export class MailConfigService implements MailerOptionsFactory {
    constructor(
        private readonly configService: ConfigService,
        private readonly i18n: I18nService,
    ) {}
    createMailerOptions(): MailerOptions {
        return {
            transport: {
                host: this.configService.get('MAIL_HOST'),
                port: this.configService.get('MAIL_PORT'),
                secure: false,
                auth: {
                    user: this.configService.get('MAIL_USER'),
                    pass: this.configService.get('MAIL_PASS'),
                },
            },
            defaults: {
                from: this.configService.get('MAIL_FROM'),
            },
            template: {
                dir: path.join(__dirname, '../resources/templates/'),
                adapter: new HandlebarsAdapter({ t: this.i18n.hbsHelper }),
            },
        };
    }
}

@Module({
    imports: [
        MailerModule.forRootAsync({
            useClass: MailConfigService,
            inject: [I18nService],
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class MailModule {}
