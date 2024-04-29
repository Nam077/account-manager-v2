import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_EMAIL {
    ID = 'id',
    EMAIL = 'email',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllEmailDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'email',
        enum: SORT_FIELD_EMAIL,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_EMAIL), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_EMAIL;
}
