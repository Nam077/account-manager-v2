import { RentalTypeModule } from './../rental-type/rental-type.module';
import { Module } from '@nestjs/common';
import { AccountPriceService } from './account-price.service';
import { AccountPriceController } from './account-price.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountPrice } from './entities/account-price.entity';
import { CaslModule } from '../casl/casl.module';
import { AccountModule } from '../account/account.module';

@Module({
    imports: [TypeOrmModule.forFeature([AccountPrice]), CaslModule, AccountModule, RentalTypeModule],
    controllers: [AccountPriceController],
    providers: [AccountPriceService],
    exports: [AccountPriceService],
})
export class AccountPriceModule {}
