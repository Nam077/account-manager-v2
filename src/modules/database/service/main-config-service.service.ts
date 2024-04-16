import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AccountCategory } from 'src/modules/account-category/entities/account-category.entity';
import { Account } from 'src/modules/account/entities/account.entity';
import { User } from 'src/modules/user/entities/user.entity';
@Injectable()
export class MainConfigServiceService implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) {}
    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'mysql',
            host: this.configService.get<string>('DB_HOST'),
            port: this.configService.get<number>('DB_PORT'),
            username: this.configService.get<string>('DB_USERNAME'),
            password: this.configService.get<string>('DB_PASSWORD'),
            database: this.configService.get<string>('DB_DATABASE'),
            entities: [User, AccountCategory, Account],
            synchronize: true,
        };
    }
}
