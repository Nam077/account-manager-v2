import { Injectable, MiddlewareConsumer, Module, NestMiddleware } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { NextFunction } from 'express';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/account/account.module';
import { AccountCategoryModule } from './modules/account-category/account-category.module';
import { AccountPriceModule } from './modules/account-price/account-price.module';
import { AdminAccountModule } from './modules/admin-account/admin-account.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaslModule } from './modules/casl/casl.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { I18nBaseModule } from './modules/i18n-base/i18n-base.module';
import { MailModule } from './modules/mail/mail.module';
import { RefreshTokenModule } from './modules/refresh-token/refresh-token.module';
import { RentalModule } from './modules/rental/rental.module';
import { RentalRenewModule } from './modules/rental-renew/rental-renew.module';
import { RentalTypeModule } from './modules/rental-type/rental-type.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { UserModule } from './modules/user/user.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { WorkspaceEmailModule } from './modules/workspace-email/workspace-email.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
        }),
        AppModule,
        DatabaseModule,
        CaslModule,
        UserModule,
        AuthModule,
        AccountCategoryModule,
        RouterModule.register([
            {
                path: 'api',
                children: [
                    {
                        path: '/',
                        module: UserModule,
                    },
                    {
                        path: '/',
                        module: AuthModule,
                    },
                    {
                        path: '/',
                        module: AccountCategoryModule,
                    },
                    {
                        path: '/',
                        module: AccountModule,
                    },
                    {
                        path: '/',
                        module: AdminAccountModule,
                    },
                    {
                        path: '/',
                        module: CustomerModule,
                    },
                    {
                        path: '/',
                        module: EmailModule,
                    },
                    {
                        path: '/',
                        module: WorkspaceModule,
                    },
                    {
                        path: '/',
                        module: RentalTypeModule,
                    },
                    {
                        path: '/',
                        module: AccountPriceModule,
                    },
                    {
                        path: '/',
                        module: WorkspaceEmailModule,
                    },
                    {
                        path: '/',
                        module: RentalModule,
                    },
                    {
                        path: '/',
                        module: RefreshTokenModule,
                    },
                    {
                        path: '/',
                        module: RentalRenewModule,
                    },
                ],
            },
        ]),
        AccountModule,
        AdminAccountModule,
        CustomerModule,
        EmailModule,
        WorkspaceModule,
        RentalTypeModule,
        AccountPriceModule,
        WorkspaceEmailModule,
        RentalModule,
        RefreshTokenModule,
        RentalRenewModule,
        MailModule,
        ScheduleModule.forRoot(),
        TelegramBotModule,
        I18nBaseModule,
    ],
    controllers: [AppController],
    providers: [AppService, ConfigService],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply().forRoutes('*');
    }
}

@Injectable()
export class DefaultAuthMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService) {}
    use(req: Request, res: Response, next: NextFunction) {
        req.headers['authorization'] = `Bearer ${this.configService.get<string>('DEFAULT_ACCESS_TOKEN')}`;
        next();
    }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        console.log('Headers:', req.headers);
        next();
    }
}
