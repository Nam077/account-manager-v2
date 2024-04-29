import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_WORKSPACE_EMAIL {
    ID = 'id',
    STATUS = 'status',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    DELETED_AT = 'deletedAt',
}

export class FindAllWorkspaceEmailDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'status',
        enum: SORT_FIELD_WORKSPACE_EMAIL,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_WORKSPACE_EMAIL), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_WORKSPACE_EMAIL;
}
