import { Injectable } from '@nestjs/common';
import { CreateAccountCategoryDto } from './dto/create-account-category.dto';
import { UpdateAccountCategoryDto } from './dto/update-account-category.dto';

@Injectable()
export class AccountCategoryService {
  create(createAccountCategoryDto: CreateAccountCategoryDto) {
    return 'This action adds a new accountCategory';
  }

  findAll() {
    return `This action returns all accountCategory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} accountCategory`;
  }

  update(id: number, updateAccountCategoryDto: UpdateAccountCategoryDto) {
    return `This action updates a #${id} accountCategory`;
  }

  remove(id: number) {
    return `This action removes a #${id} accountCategory`;
  }
}
