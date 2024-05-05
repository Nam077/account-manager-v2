import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CreateEmailDto } from './dto/create-email.dto';
import { FindAllEmailDto } from './dto/find-all.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailService } from './email.service';
import { Email } from './entities/email.entity';

@ApiBearerAuth()
@ApiTags('Email')
@UseGuards(AuthJwtGuard)
@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createEmailDto: CreateEmailDto) {
        return this.emailService.create(user, createEmailDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllEmailDto) {
        return this.emailService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.emailService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.emailService.restore(user, id);
    }

    @RemoveFields<Email>(['customer'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(@GetCurrentUser() user: UserAuth, @Param('id') id: string, @Body() updateEmailDto: UpdateEmailDto) {
        return this.emailService.update(user, id, updateEmailDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.emailService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.emailService.remove(user, id);
    }
}
