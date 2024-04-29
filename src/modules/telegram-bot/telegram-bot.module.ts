import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule, TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';

import { GreeterUpdate } from './greeter';
@Injectable()
class TelegrafConfigService implements TelegrafOptionsFactory {
    constructor(private readonly configService: ConfigService) {}
    createTelegrafOptions(): TelegrafModuleOptions {
        return {
            token: this.configService.get('TELEGRAM_BOT_TOKEN'),
        };
    }
}
@Module({
    imports: [
        TelegrafModule.forRootAsync({
            useClass: TelegrafConfigService,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    providers: [TelegrafConfigService, GreeterUpdate],
})
export class TelegramBotModule {}
