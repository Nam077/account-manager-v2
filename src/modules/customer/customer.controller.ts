import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';

@ApiTags('Customer')
@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createCustomerDto: CreateCustomerDto) {
        return this.customerService.create(user, createCustomerDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.customerService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.customerService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.customerService.restore(user, id);
    }

    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        return this.customerService.update(user, id, updateCustomerDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.customerService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.customerService.remove(user, id);
    }
}