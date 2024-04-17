import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AccountPriceService } from './account-price.service';
import { CreateAccountPriceDto } from './dto/create-account-price.dto';
import { UpdateAccountPriceDto } from './dto/update-account-price.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
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
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
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
