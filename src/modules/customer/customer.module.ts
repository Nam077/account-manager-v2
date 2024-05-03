import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Customer]), forwardRef(() => EmailModule)],
    controllers: [CustomerController],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule {}
