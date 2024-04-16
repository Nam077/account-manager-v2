import { Module } from '@nestjs/common';
import { AccountCategoryService } from './account-category.service';
import { AccountCategoryController } from './account-category.controller';

@Module({
  controllers: [AccountCategoryController],
  providers: [AccountCategoryService],
})
export class AccountCategoryModule {}
