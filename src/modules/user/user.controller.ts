import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser } from '../../decorator/auth.decorator';
import { FindAllDto } from '../../dto/find-all.dto';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@GetCurrentUser() user: any, @Body() createUserDto: CreateUserDto) {
        return this.userService.create(user, createUserDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.userService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.userService.findOne(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(user, id, updateUserDto);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.userService.restore(user, id);
    }
    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.userService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.userService.remove(user, id);
    }
}
