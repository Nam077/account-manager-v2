import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
import { AccountPriceService } from './account-price.service';
import { CreateAccountPriceDto } from './dto/create-account-price.dto';
import { FindAllAccountPriceDto } from './dto/find-all.dto';
import { UpdateAccountPriceDto } from './dto/update-account-price.dto';

@ApiTags('Account Price')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('account-price')
export class AccountPriceController {
    constructor(private readonly accountPriceService: AccountPriceService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createAccountPriceDto: CreateAccountPriceDto) {
        return this.accountPriceService.create(user, createAccountPriceDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllAccountPriceDto) {
        return this.accountPriceService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountPriceService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountPriceService.restore(user, id);
    }

    @Patch(':id')
    update(
        @GetCurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateAccountPriceDto: UpdateAccountPriceDto,
    ) {
        return this.accountPriceService.update(user, id, updateAccountPriceDto);
    }

    @Delete('hard-remove/:id')
    removeHard(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountPriceService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountPriceService.remove(user, id);
    }
}
