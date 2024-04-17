import { FindAllDto } from 'src/dto/find-all.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
@ApiBearerAuth()
@ApiTags('Email')
@UseGuards(AuthJwtGuard)
@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createEmailDto: CreateEmailDto) {
        return this.emailService.create(user, createEmailDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.emailService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.emailService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.emailService.restore(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateEmailDto: UpdateEmailDto) {
        return this.emailService.update(user, id, updateEmailDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.emailService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.emailService.remove(user, id);
    }
}