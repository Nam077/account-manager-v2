import { Module } from '@nestjs/common';
import { RentalTypeService } from './rental-type.service';
import { RentalTypeController } from './rental-type.controller';
import { CaslModule } from '../casl/casl.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalType } from './entities/rental-type.entity';

@Module({
    imports: [CaslModule, TypeOrmModule.forFeature([RentalType])],
    controllers: [RentalTypeController],
    providers: [RentalTypeService],
    exports: [RentalTypeService],
})
export class RentalTypeModule {}
