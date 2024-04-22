import { Injectable, Module, NestMiddleware } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
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
import { RefreshTokenModule } from './modules/refresh-token/refresh-token.module';
import { RentalModule } from './modules/rental/rental.module';
import { RentalTypeModule } from './modules/rental-type/rental-type.module';
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    // configure(consumer: MiddlewareConsumer) {
    //     consumer.apply(DefaultAuthMiddleware).forRoutes('*');
    // }
}
@Injectable()
export class DefaultAuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        //    set default bearer token
        req.headers['authorization'] =
            `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5kb2VAZXhhbXBsZS5jb20iLCJzdWIiOiJkMDg3NDY2MC05Mjc2LTRiMWUtOTQ2MC1jNjNkMGRiMDUzMzgiLCJpYXQiOjE3MTM3NTg2NDEsImV4cCI6MTcxNDYyMjY0MX0.5MgNxaqLH98xVIMSe3Q_TnvxoQzBiWqozVBQYk6ssk8`;
        next();
    }
}
