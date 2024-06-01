import { GrammyModuleOptions, GrammyOptionsFactory, NestjsGrammyModule } from '@grammyjs/nestjs';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RentalModule } from '../rental/rental.module';
import { GreeterUpdate } from './greeter';

@Injectable()
class GrammyConfigService implements GrammyOptionsFactory {
    constructor(private readonly configService: ConfigService) {}
    createGrammyOptions(): GrammyModuleOptions {
        return {
            token: this.configService.get('TELEGRAM_BOT_TOKEN'),
        };
    }
}
@Module({
    imports: [
        NestjsGrammyModule.forRootAsync({
            useClass: GrammyConfigService,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        RentalModule,
    ],
    providers: [GrammyConfigService, GreeterUpdate],
})
export class TelegramBotModule {}
