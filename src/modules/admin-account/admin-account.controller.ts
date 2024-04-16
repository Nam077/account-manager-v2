import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminAccountService } from './admin-account.service';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';

@Controller('admin-account')
export class AdminAccountController {
  constructor(private readonly adminAccountService: AdminAccountService) {}

  @Post()
  create(@Body() createAdminAccountDto: CreateAdminAccountDto) {
    return this.adminAccountService.create(createAdminAccountDto);
  }

  @Get()
  findAll() {
    return this.adminAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminAccountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminAccountDto: UpdateAdminAccountDto) {
    return this.adminAccountService.update(+id, updateAdminAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminAccountService.remove(+id);
  }
}
