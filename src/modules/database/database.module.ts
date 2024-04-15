import { Module } from '@nestjs/common';
import { MainConfigServiceService } from './service/main-config-service.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';

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
