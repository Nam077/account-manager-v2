import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { CaslModule } from '../casl/casl.module';
import { CustomerModule } from '../customer/customer.module';
import { Email } from './entities/email.entity';

@Module({
    imports: [CaslModule, CustomerModule, TypeOrmModule.forFeature([Email])],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
