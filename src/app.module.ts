import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaslModule } from './modules/casl/casl.module';
import { AccountCategoryModule } from './modules/account-category/account-category.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
        }),
        DatabaseModule,
        UserModule,
        AuthModule,
        CaslModule,
        AccountCategoryModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
