import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountPriceDto {
    @ApiProperty({ description: 'Price of the account', example: 100 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    readonly price: number;

    @ApiProperty({ description: 'ID of the associated account', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    readonly accountId: string;

    @ApiProperty({ description: 'ID of the associated rental type', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsNotEmpty()
    @IsUUID()
    readonly rentalTypeId: string;
}
