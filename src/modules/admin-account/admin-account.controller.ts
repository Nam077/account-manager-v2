import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { AdminAccountService } from './admin-account.service';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { FindAllAdminAccountDto } from './dto/find-all.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { AdminAccount } from './entities/admin-account.entity';

@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@ApiTags('Admin Account')
@Controller('admin-account')
export class AdminAccountController {
    constructor(private readonly adminAccountService: AdminAccountService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createAdminAccountDto: CreateAdminAccountDto) {
        return this.adminAccountService.create(user, createAdminAccountDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllAdminAccountDto) {
        return this.adminAccountService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.adminAccountService.findOne(user, id);
    }

    @Patch('/restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.adminAccountService.restore(user, id);
    }

    @RemoveFields<AdminAccount>(['account', 'workspaces'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateAdminAccountDto: UpdateAdminAccountDto,
    ) {
        return this.adminAccountService.update(user, id, updateAdminAccountDto);
    }
    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.adminAccountService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.adminAccountService.remove(user, id);
    }
}
