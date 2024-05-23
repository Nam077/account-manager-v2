import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { AccountPriceService } from './account-price.service';
import { CreateAccountPriceDto } from './dto/create-account-price.dto';
import { FindAllAccountPriceDto } from './dto/find-all.dto';
import { UpdateAccountPriceDto } from './dto/update-account-price.dto';
import { AccountPrice } from './entities/account-price.entity';

@ApiTags('Account Price')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('account-price')
export class AccountPriceController {
    constructor(private readonly accountPriceService: AccountPriceService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createAccountPriceDto: CreateAccountPriceDto) {
        return this.accountPriceService.create(user, createAccountPriceDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllAccountPriceDto) {
        return this.accountPriceService.findAll(user, findAllDto);
    }

    @Get('/by-account/:id')
    findByAccount(
        @GetCurrentUser() user: UserAuth,
        @Query() findAllDto: FindAllAccountPriceDto,
        @Param('id') id: string,
    ) {
        return this.accountPriceService.findByAccount(user, findAllDto, id);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountPriceService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountPriceService.restore(user, id);
    }

    @RemoveFields<AccountPrice>(['account', 'rentalType'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateAccountPriceDto: UpdateAccountPriceDto,
    ) {
        return this.accountPriceService.update(user, id, updateAccountPriceDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountPriceService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.accountPriceService.remove(user, id);
    }
}
