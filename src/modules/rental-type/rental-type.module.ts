import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RentalType } from './entities/rental-type.entity';
import { RentalTypeController } from './rental-type.controller';
import { RentalTypeService } from './rental-type.service';

@Module({
    imports: [TypeOrmModule.forFeature([RentalType])],
    controllers: [RentalTypeController],
    providers: [RentalTypeService],
    exports: [RentalTypeService],
})
export class RentalTypeModule {}
