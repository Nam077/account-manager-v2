import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountPriceModule } from '../account-price/account-price.module';
import { CaslModule } from '../casl/casl.module';
import { CustomerModule } from '../customer/customer.module';
import { EmailModule } from '../email/email.module';
import { MailModule } from '../mail/mail.module';
import { RentalRenewModule } from '../rental-renew/rental-renew.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { WorkspaceEmailModule } from '../workspace-email/workspace-email.module';
import { Rental } from './entities/rental.entity';
import { RentalController } from './rental.controller';
import { RentalService } from './rental.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rental]),
        CustomerModule,
        WorkspaceModule,
        AccountPriceModule,
        EmailModule,
        CaslModule,
        WorkspaceEmailModule,
        ConfigModule,
        MailModule,
        ScheduleModule.forRoot(),
        forwardRef(() => RentalRenewModule),
    ],
    controllers: [RentalController],
    providers: [RentalService],
    exports: [RentalService],
})
export class RentalModule {}
