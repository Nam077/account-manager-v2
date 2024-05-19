import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { FindAllAccountDto } from './dto/find-all.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';

@ApiTags('Account')
@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@Controller('account')
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createAccountDto: CreateAccountDto) {
        return this.accountService.create(user, createAccountDto);
    }

    @Get('all')
    findAllAccount(@GetCurrentUser() user: UserAuth) {
        return this.accountService.findAllAccount(user);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllAccountDto) {
        return this.accountService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountService.restore(user, id);
    }
    @RemoveFields<Account>(['accountCategory', 'slug', 'accountPrices', 'adminAccounts'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(@GetCurrentUser() user: UserAuth, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
        return this.accountService.update(user, id, updateAccountDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountService.remove(user, id, true);
    }
    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountService.remove(user, id);
    }
}
