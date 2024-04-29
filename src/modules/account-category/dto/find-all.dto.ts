import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_ACCOUNT_CATEGORY {
    ID = 'id',
    NAME = 'name',
    DESCRIPTION = 'description',
    SLUG = 'slug',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllAccountCategoryDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'name',
        enum: SORT_FIELD_ACCOUNT_CATEGORY,
    })
    @IsString({ message: 'SortField must be a string' })
    @IsOptionalCustom()
    sortField?: SORT_FIELD_ACCOUNT_CATEGORY;
}
