import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateAccountPriceDto {
    @ApiProperty({ description: 'Price of the account', example: 100 })
    @IsNotEmpty({ message: 'validation.accountPrice.price.required' })
    @IsNumber({}, { message: 'validation.accountPrice.price.isNumber' })
    @Min(0, { message: 'validation.accountPrice.price.min' })
    readonly price: number;

    @ApiProperty({
        description: 'ID of the associated account',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: 'validation.accountPrice.accountId.required' })
    @IsUUID(undefined, { message: 'validation.accountPrice.accountId.isUUID' })
    readonly accountId: string;

    @ApiProperty({
        description: 'ID of the associated rental type',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsNotEmpty({ message: 'validation.accountPrice.rentalTypeId.required' })
    @IsUUID(undefined, { message: 'validation.accountPrice.rentalTypeId.isUUID' })
    readonly rentalTypeId: string;
}
