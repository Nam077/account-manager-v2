import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom, RentalTypeEnums } from '../../../common';

enum SORT_FIELD_ACCOUNT_PRICE {
    ID = 'id',
    PRICE = 'price',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllAccountPriceDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'price',
        enum: SORT_FIELD_ACCOUNT_PRICE,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_ACCOUNT_PRICE), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_ACCOUNT_PRICE;

    @ApiPropertyOptional({
        description: 'Rental type',
        example: RentalTypeEnums.PERSONAL,
        enum: RentalTypeEnums,
    })
    @IsOptionalCustom()
    @IsEnum(RentalTypeEnums, { message: 'Type must be a valid enum value' })
    rentalType?: RentalTypeEnums;
}
