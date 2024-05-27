import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { DatabaseDumpService } from './service/dump.service';
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
    providers: [MainConfigServiceService, DatabaseDumpService],
})
export class DatabaseModule {}
