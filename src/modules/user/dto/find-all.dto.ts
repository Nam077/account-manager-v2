import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_USER {
    ID = 'id',
    NAME = 'name',
    EMAIL = 'email',
    ROLE = 'role',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class FindAllUserDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'name',
        enum: SORT_FIELD_USER,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_USER), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_USER;
}
