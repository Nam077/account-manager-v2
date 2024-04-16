import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
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

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
        return this.accountService.update(user, id, updateAccountDto);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountService.remove(user, id);
    }
}
