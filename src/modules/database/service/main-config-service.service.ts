import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Account } from 'src/modules/account/entities/account.entity';
import { AccountCategory } from 'src/modules/account-category/entities/account-category.entity';
import { AccountPrice } from 'src/modules/account-price/entities/account-price.entity';
import { AdminAccount } from 'src/modules/admin-account/entities/admin-account.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { Email } from 'src/modules/email/entities/email.entity';
import { RentalType } from 'src/modules/rental-type/entities/rental-type.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Workspace } from 'src/modules/workspace/entities/workspace.entity';
import { WorkspaceEmail } from 'src/modules/workspace-email/entities/workspace-email.entity';

import { Rental } from '../../rental/entities/rental.entity';
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
            entities: [
                User,
                AccountCategory,
                Account,
                AdminAccount,
                Customer,
                Email,
                Workspace,
                RentalType,
                AccountPrice,
                WorkspaceEmail,
                Rental,
            ],
            synchronize: true,
            // logging: true,
        };
    }
}
