import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CreateRentalTypeDto } from './dto/create-rental-type.dto';
import { FindAllRentalTypeDto } from './dto/find-all.dto';
import { UpdateRentalTypeDto } from './dto/update-rental-type.dto';
import { RentalType } from './entities/rental-type.entity';
import { RentalTypeService } from './rental-type.service';

@ApiTags('Rental Type')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('rental-type')
export class RentalTypeController {
    constructor(private readonly rentalTypeService: RentalTypeService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createRentalTypeDto: CreateRentalTypeDto) {
        return this.rentalTypeService.create(user, createRentalTypeDto);
    }

    @Get('all')
    findAllData(@GetCurrentUser() user: UserAuth) {
        return this.rentalTypeService.findAllData(user);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllRentalTypeDto) {
        return this.rentalTypeService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalTypeService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalTypeService.restore(user, id);
    }

    @RemoveFields<RentalType>(['accountPrices'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateRentalTypeDto: UpdateRentalTypeDto,
    ) {
        return this.rentalTypeService.update(user, id, updateRentalTypeDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalTypeService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalTypeService.remove(user, id);
    }
}
