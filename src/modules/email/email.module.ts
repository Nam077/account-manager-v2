import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '../casl/casl.module';
import { CustomerModule } from '../customer/customer.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { Email } from './entities/email.entity';

@Module({
    imports: [CaslModule, CustomerModule, TypeOrmModule.forFeature([Email])],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
