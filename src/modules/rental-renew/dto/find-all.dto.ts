import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_RENEWAL {
    ID = 'id',
    NEW_END_DATE = 'new_end_date',
    LAST_START_DATE = 'last_start_date',
    RENEWAL_FEE = 'renewal_fee',
    PAYMENT_METHOD = 'payment_method',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllRentalRenewDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'new_end_date',
        enum: SORT_FIELD_RENEWAL,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_RENEWAL), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_RENEWAL;
}
