import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountCategoryService } from './account-category.service';
import { CreateAccountCategoryDto } from './dto/create-account-category.dto';
import { UpdateAccountCategoryDto } from './dto/update-account-category.dto';

@Controller('account-category')
export class AccountCategoryController {
  constructor(private readonly accountCategoryService: AccountCategoryService) {}

  @Post()
  create(@Body() createAccountCategoryDto: CreateAccountCategoryDto) {
    return this.accountCategoryService.create(createAccountCategoryDto);
  }

  @Get()
  findAll() {
    return this.accountCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountCategoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountCategoryDto: UpdateAccountCategoryDto) {
    return this.accountCategoryService.update(+id, updateAccountCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountCategoryService.remove(+id);
  }
}
