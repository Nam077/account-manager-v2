import { Module } from '@nestjs/common';
import { AccountCategoryService } from './account-category.service';
import { AccountCategoryController } from './account-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountCategory } from './entities/account-category.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
    imports: [TypeOrmModule.forFeature([AccountCategory]), CaslModule],
    controllers: [AccountCategoryController],
    providers: [AccountCategoryService],
    exports: [AccountCategoryService],
})
export class AccountCategoryModule {}
