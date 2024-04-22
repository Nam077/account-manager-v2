import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountModule } from '../account/account.module';
import { CaslModule } from '../casl/casl.module';
import { RentalTypeModule } from './../rental-type/rental-type.module';
import { AccountPriceController } from './account-price.controller';
import { AccountPriceService } from './account-price.service';
import { AccountPrice } from './entities/account-price.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AccountPrice]), CaslModule, AccountModule, RentalTypeModule],
    controllers: [AccountPriceController],
    providers: [AccountPriceService],
    exports: [AccountPriceService],
})
export class AccountPriceModule {}
