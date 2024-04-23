import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { FindAllDto, GetCurrentUser } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Account')
@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@Controller('account')
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createAccountDto: CreateAccountDto) {
        return this.accountService.create(user, createAccountDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.accountService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountService.restore(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
        return this.accountService.update(user, id, updateAccountDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountService.remove(user, id, true);
    }
    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountService.remove(user, id);
    }
}
