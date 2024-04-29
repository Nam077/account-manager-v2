import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
import { CreateRentalRenewDto } from './dto/create-rental-renew.dto';
import { FindAllRentalRenewDto } from './dto/find-all.dto';
import { UpdateRentalRenewDto } from './dto/update-rental-renew.dto';
import { RentalRenewService } from './rental-renew.service';
@ApiTags('RentalRenew')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('rental-renew')
export class RentalRenewController {
    constructor(private readonly rentalRenewService: RentalRenewService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createRentalRenewDto: CreateRentalRenewDto) {
        return this.rentalRenewService.create(user, createRentalRenewDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllRentalRenewDto) {
        return this.rentalRenewService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalRenewService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalRenewService.restore(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateRentalRenewDto: UpdateRentalRenewDto) {
        return this.rentalRenewService.update(user, id, updateRentalRenewDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalRenewService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalRenewService.remove(user, id);
    }
}
