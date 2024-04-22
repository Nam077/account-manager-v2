import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '../casl/casl.module';
import { RentalType } from './entities/rental-type.entity';
import { RentalTypeController } from './rental-type.controller';
import { RentalTypeService } from './rental-type.service';

@Module({
    imports: [CaslModule, TypeOrmModule.forFeature([RentalType])],
    controllers: [RentalTypeController],
    providers: [RentalTypeService],
    exports: [RentalTypeService],
})
export class RentalTypeModule {}
