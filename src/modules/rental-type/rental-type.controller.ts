import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RentalTypeService } from './rental-type.service';
import { CreateRentalTypeDto } from './dto/create-rental-type.dto';
import { UpdateRentalTypeDto } from './dto/update-rental-type.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
@ApiTags('Rental Type')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('rental-type')
export class RentalTypeController {
    constructor(private readonly rentalTypeService: RentalTypeService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createRentalTypeDto: CreateRentalTypeDto) {
        return this.rentalTypeService.create(user, createRentalTypeDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.rentalTypeService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalTypeService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalTypeService.restore(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateRentalTypeDto: UpdateRentalTypeDto) {
        return this.rentalTypeService.update(user, id, updateRentalTypeDto);
    }

    @Delete('hard-remove/:id')
    removeHard(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalTypeService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.rentalTypeService.remove(user, id);
    }
}
