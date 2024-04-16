import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountCategoryModule } from '../account-category/account-category.module';
import { CaslModule } from '../casl/casl.module';

@Module({
    imports: [TypeOrmModule.forFeature([Account]), AccountCategoryModule, CaslModule],
    controllers: [AccountController],
    providers: [AccountService],
    exports: [AccountService],
})
export class AccountModule {}
