import { ConfigModule } from '@nestjs/config';
import { Injectable, MiddlewareConsumer, Module, NestMiddleware } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaslModule } from './modules/casl/casl.module';
import { AccountCategoryModule } from './modules/account-category/account-category.module';
import { RouterModule } from '@nestjs/core';
import { AccountModule } from './modules/account/account.module';
import { NextFunction } from 'express';
import { AdminAccountModule } from './modules/admin-account/admin-account.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EmailModule } from './modules/email/email.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { RentalTypeModule } from './modules/rental-type/rental-type.module';
import { AccountPriceModule } from './modules/account-price/account-price.module';
import { WorkspaceEmailModule } from './modules/workspace-email/workspace-email.module';
import { RentalModule } from './modules/rental/rental.module';

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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(DefaultAuthMiddleware).forRoutes('*'); // Áp dụng cho tất cả các route, hoặc chỉ định cụ thể
    }
}
@Injectable()
export class DefaultAuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        //    set default bearer token
        req.headers['authorization'] =
            `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5kb2VAZXhhbXBsZS5jb20iLCJzdWIiOiI5NTNhMTk5NS04ZTQ5LTQ5ZmUtODk5MS1iNGM4NjBmM2QyMDgiLCJpYXQiOjE3MTMyOTczMzEsImV4cCI6MTcxNDE2MTMzMX0.FcUCAQvnWwRAOqvRbzXVLIUqEDzHnmMI0gjprJ2-ujk`;
        next();
    }
}
