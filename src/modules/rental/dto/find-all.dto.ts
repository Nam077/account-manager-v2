import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom, RentalStatus } from '../../../common';

enum SORT_FIELD_RENTAL {
    ID = 'id',
    START_DATE = 'start_date',
    END_DATE = 'end_date',
    TOTAL_PRICE = 'total_price',
    STATUS = 'status',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllRentalDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'start_date',
        enum: SORT_FIELD_RENTAL,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_RENTAL), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_RENTAL;

    // status

    @ApiPropertyOptional({
        description: 'Status',
        example: RentalStatus.ACTIVE,
    })
    @IsOptionalCustom()
    @IsIn([...Object.values(RentalStatus), 'near_expired', ''], { message: 'Status must be one of the allowed values' })
    status?: string;
}
