import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { MainConfigServiceService } from './service/main-config-service.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            name: 'default',
            useClass: MainConfigServiceService,
        }),
        UserModule,
    ],
    providers: [MainConfigServiceService],
})
export class DatabaseModule {}
