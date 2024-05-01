import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFields } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { RemoveFieldInterceptor } from '../../common/intercepter/remove-field.interceptor';
import { User } from '../user/entities/user.entity';
import { AccountCategoryService } from './account-category.service';
import { CreateAccountCategoryDto } from './dto/create-account-category.dto';
import { FindAllAccountCategoryDto } from './dto/find-all.dto';
import { UpdateAccountCategoryDto } from './dto/update-account-category.dto';
import { AccountCategory } from './entities/account-category.entity';

@Controller('account-category')
@ApiTags('Account Category')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
export class AccountCategoryController {
    constructor(private readonly accountCategoryService: AccountCategoryService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createAccountCategoryDto: CreateAccountCategoryDto) {
        return this.accountCategoryService.create(user, createAccountCategoryDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllAccountCategoryDto) {
        return this.accountCategoryService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountCategoryService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountCategoryService.restore(user, id);
    }

    @RemoveFields<AccountCategory>(['accounts', 'slug'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(
        @GetCurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateAccountCategoryDto: UpdateAccountCategoryDto,
    ) {
        return this.accountCategoryService.update(user, id, updateAccountCategoryDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountCategoryService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.accountCategoryService.remove(user, id);
    }
}
