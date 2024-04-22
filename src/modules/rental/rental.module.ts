import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { CustomerModule } from '../customer/customer.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AccountPriceModule } from '../account-price/account-price.module';
import { EmailModule } from '../email/email.module';
import { CaslModule } from '../casl/casl.module';
import { WorkspaceEmailModule } from '../workspace-email/workspace-email.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rental]),
        CustomerModule,
        WorkspaceModule,
        AccountPriceModule,
        EmailModule,
        CaslModule,
        WorkspaceEmailModule,
    ],
    controllers: [RentalController],
    providers: [RentalService],
    exports: [RentalService],
})
export class RentalModule {}
