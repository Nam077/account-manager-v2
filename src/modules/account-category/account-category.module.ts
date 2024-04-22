import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '../casl/casl.module';
import { AccountCategoryController } from './account-category.controller';
import { AccountCategoryService } from './account-category.service';
import { AccountCategory } from './entities/account-category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AccountCategory]), CaslModule],
    controllers: [AccountCategoryController],
    providers: [AccountCategoryService],
    exports: [AccountCategoryService],
})
export class AccountCategoryModule {}
