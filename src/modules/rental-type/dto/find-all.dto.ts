import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_RENTAL_TYPE {
    ID = 'id',
    NAME = 'name',
    DESCRIPTION = 'description',
    MAX_SLOTS = 'max_slots',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class FindAllRentalTypeDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'name',
        enum: SORT_FIELD_RENTAL_TYPE,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_RENTAL_TYPE), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_RENTAL_TYPE;
}
