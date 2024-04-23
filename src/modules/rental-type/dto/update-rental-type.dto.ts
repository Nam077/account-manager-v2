import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';
import { CreateRentalTypeDto } from './create-rental-type.dto';

export class UpdateRentalTypeDto extends PartialType(CreateRentalTypeDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;

    @IsOptionalCustom()
    maxSlots: number;
}
