import { Module } from '@nestjs/common';
import { MainConfigServiceService } from './database/service/main-config-service.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      name: 'default',
      useClass: MainConfigServiceService,
    }),
  ],
  providers: [MainConfigServiceService],
})
export class DatabaseModule {}
