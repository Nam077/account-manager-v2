import { PartialType } from '@nestjs/swagger';
import { CreateRentalTypeDto } from './create-rental-type.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateRentalTypeDto extends PartialType(CreateRentalTypeDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;

    @IsOptionalCustom()
    maxSlots: number;
}
