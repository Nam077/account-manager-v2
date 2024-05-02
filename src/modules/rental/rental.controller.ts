import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { FindAllRentalDto } from './dto/find-all.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Rental } from './entities/rental.entity';
import { RentalService } from './rental.service';

@ApiTags('Rental')
@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@Controller('rental')
export class RentalController {
    constructor(private readonly rentalService: RentalService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createRentalDto: CreateRentalDto) {
        return this.rentalService.create(user, createRentalDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllRentalDto) {
        return this.rentalService.findAll(user, findAllDto);
    }

    @Get('check')
    check() {
        return this.rentalService.checkExpiredAll();
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalService.findOne(user, id);
    }
    @Patch('/restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalService.restore(user, id);
    }

    @RemoveFields<Rental>(['customer', 'account', 'customerId', 'workspaceEmail', 'rentalRenews', 'accountId'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
        return this.rentalService.update(user, id, updateRentalDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalService.remove(user, id);
    }
}
