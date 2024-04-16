import { Injectable } from '@nestjs/common';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';

@Injectable()
export class AdminAccountService {
  create(createAdminAccountDto: CreateAdminAccountDto) {
    return 'This action adds a new adminAccount';
  }

  findAll() {
    return `This action returns all adminAccount`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminAccount`;
  }

  update(id: number, updateAdminAccountDto: UpdateAdminAccountDto) {
    return `This action updates a #${id} adminAccount`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminAccount`;
  }
}
