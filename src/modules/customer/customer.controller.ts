import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { FindAllCustomerDto } from './dto/find-all.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('Customer')
@UseGuards(AuthJwtGuard)
@ApiBearerAuth()
@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @Post()
    public create(@GetCurrentUser() user: UserAuth, @Body() createCustomerDto: CreateCustomerDto) {
        return this.customerService.create(user, createCustomerDto);
    }

    @Get()
    public findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllCustomerDto) {
        return this.customerService.findAll(user, findAllDto);
    }

    @Get(':id/email')
    public findEmails(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.customerService.findEmails(user, id);
    }

    @Get(':id')
    public findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.customerService.findOne(user, id);
    }

    @Patch('restore/:id')
    public restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.customerService.restore(user, id);
    }

    @RemoveFields<Customer>(['emails', 'rentals'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    public update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
    ) {
        return this.customerService.update(user, id, updateCustomerDto);
    }

    @Delete('hard-delete/:id')
    public hardRemove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.customerService.remove(user, id, true);
    }

    @Delete(':id')
    public remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.customerService.remove(user, id);
    }
}
