import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

import { ToCapitalize } from '../../../common';

export class CreateRentalTypeDto {
    @ApiProperty({
        description: 'Name of the rental type',
        example: 'Rental Type Name',
    })
    @IsNotEmpty({ message: 'validation.createRentalType.name.isNotEmpty' })
    @IsString({ message: 'validation.createRentalType.name.isString' })
    @ToCapitalize()
    name: string;

    @ApiProperty({
        description: 'Description of the rental type',
        example: 'Rental Type Description',
    })
    @IsString({ message: 'validation.createRentalType.description.isString' })
    description: string;

    @ApiProperty({
        description: 'Maximum slots allowed in the rental type',
        example: 10,
    })
    @IsInt({ message: 'validation.createRentalType.maxSlots.isInt' })
    @Min(1, { message: 'validation.createRentalType.maxSlots.min' })
    maxSlots: number;
}
