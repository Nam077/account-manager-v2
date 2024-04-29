import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthJwtGuard } from '../../common/guard';
import { CreateRentalRenewDto } from './dto/create-rental-renew.dto';
import { UpdateRentalRenewDto } from './dto/update-rental-renew.dto';
import { RentalRenewService } from './rental-renew.service';

@Controller('rental-renew')
@ApiTags('Rental Renew')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
export class RentalRenewController {
    constructor(private readonly rentalRenewService: RentalRenewService) {}

    @Post()
    create(@Body() createRentalRenewDto: CreateRentalRenewDto) {
        return this.rentalRenewService.create(createRentalRenewDto);
    }

    @Get()
    findAll() {
        return this.rentalRenewService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rentalRenewService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRentalRenewDto: UpdateRentalRenewDto) {
        return this.rentalRenewService.update(+id, updateRentalRenewDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rentalRenewService.remove(+id);
    }
}
