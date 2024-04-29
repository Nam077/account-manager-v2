import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_ACCOUNT {
    ID = 'id',
    SLUG = 'slug',
    NAME = 'name',
    DESCRIPTION = 'description',
    CREATED_AT = 'created_at', // snake case cho createdAt
    UPDATED_AT = 'updated_at', // snake case cho updatedAt
    ACCOUNT_CATEGORY_ID = 'account_category_id', // snake case cho accountCategoryId
}

export class FindAllAccountDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'name',
        enum: SORT_FIELD_ACCOUNT,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_ACCOUNT), { message: 'Invalid sort field' })
    sortField?: SORT_FIELD_ACCOUNT;
}
