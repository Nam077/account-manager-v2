import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountCategoryModule } from '../account-category/account-category.module';
import { CaslModule } from '../casl/casl.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Account]), AccountCategoryModule, CaslModule],
    controllers: [AccountController],
    providers: [AccountService],
    exports: [AccountService],
})
export class AccountModule {}
