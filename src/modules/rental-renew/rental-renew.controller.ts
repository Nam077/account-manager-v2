import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CreateRentalRenewDto } from './dto/create-rental-renew.dto';
import { FindAllRentalRenewDto } from './dto/find-all.dto';
import { UpdateRentalRenewDto } from './dto/update-rental-renew.dto';
import { RentalRenew } from './entities/rental-renew.entity';
import { RentalRenewService } from './rental-renew.service';

@ApiTags('RentalRenew')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('rental-renew')
export class RentalRenewController {
    constructor(private readonly rentalRenewService: RentalRenewService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createRentalRenewDto: CreateRentalRenewDto) {
        return this.rentalRenewService.create(user, createRentalRenewDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllRentalRenewDto) {
        return this.rentalRenewService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalRenewService.findOne(user, id);
    }

    @RemoveFields<RentalRenew>(['rental'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalRenewService.restore(user, id);
    }

    @Patch(':id')
    update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateRentalRenewDto: UpdateRentalRenewDto,
    ) {
        return this.rentalRenewService.update(user, id, updateRentalRenewDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalRenewService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.rentalRenewService.remove(user, id);
    }
}
