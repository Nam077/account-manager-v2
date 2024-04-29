import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule, MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { I18nService } from 'nestjs-i18n';
import { join } from 'path';

import { MailService } from './mail.service';

@Injectable()
class MailerConfigService implements MailerOptionsFactory {
    constructor(
        private readonly configService: ConfigService,
        private readonly i18n: I18nService,
    ) {}
    createMailerOptions(): MailerOptions {
        return {
            transport: {
                host: this.configService.get('MAIL_HOST'),
                port: this.configService.get('MAIL_PORT'),
                auth: {
                    user: this.configService.get('MAIL_USER'),
                    pass: this.configService.get('MAIL_PASS'),
                },
            },
            defaults: {
                from: this.configService.get('MAIL_FROM'),
            },
            template: {
                adapter: new HandlebarsAdapter({
                    t: this.i18n.hbsHelper,
                }),
                options: {
                    strict: true,
                },
                dir: join(__dirname, '../../mail/templates'),
            },
        };
    }
}
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MailerModule.forRootAsync({
            useClass: MailerConfigService,
            inject: [ConfigService, I18nService],
        }),
    ],
    controllers: [],
    providers: [MailerConfigService, MailService],
    exports: [MailService],
})
export class MailModule {
    constructor() {
        console.log(join(__dirname, '../../mail/templates'));
    }
}
