import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from './entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';

@Controller('user')
@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createUserDto: CreateUserDto) {
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

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.userService.remove(user, id);
    }
}
