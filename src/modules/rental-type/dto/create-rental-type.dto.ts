import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ToCapitalize } from 'src/decorator/validator';

export class CreateRentalTypeDto {
    @ApiProperty({ description: 'Name of the rental type', example: 'Rental Type Name' })
    @IsNotEmpty()
    @IsString()
    @ToCapitalize()
    name: string;

    @ApiProperty({ description: 'Description of the rental type', example: 'Rental Type Description' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Maximum slots allowed in the rental type', example: 10 })
    @IsInt()
    @Min(1)
    maxSlots: number;
}
