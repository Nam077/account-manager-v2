import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '../casl/casl.module';
import { RentalModule } from '../rental/rental.module';
import { WorkspaceEmailModule } from '../workspace-email/workspace-email.module';
import { RentalRenew } from './entities/rental-renew.entity';
import { RentalRenewController } from './rental-renew.controller';
import { RentalRenewService } from './rental-renew.service';

@Module({
    imports: [TypeOrmModule.forFeature([RentalRenew]), CaslModule, RentalModule, WorkspaceEmailModule],
    controllers: [RentalRenewController],
    providers: [RentalRenewService],
    exports: [RentalRenewService],
})
export class RentalRenewModule {}
