import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { Account } from '../../account/entities/account.entity';
import { AccountCategory } from '../../account-category/entities/account-category.entity';
import { AccountPrice } from '../../account-price/entities/account-price.entity';
import { AdminAccount } from '../../admin-account/entities/admin-account.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Email } from '../../email/entities/email.entity';
import { RefreshToken } from '../../refresh-token/entities/refresh-token.entity';
import { Rental } from '../../rental/entities/rental.entity';
import { RentalRenew } from '../../rental-renew/entities/rental-renew.entity';
import { RentalType } from '../../rental-type/entities/rental-type.entity';
import { User } from '../../user/entities/user.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { WorkspaceEmail } from '../../workspace-email/entities/workspace-email.entity';

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
                RefreshToken,
                RentalRenew,
            ],
            synchronize: true,
            logging: true,
        };
    }
}
