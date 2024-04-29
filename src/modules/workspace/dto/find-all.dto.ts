import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_WORKSPACE {
    ID = 'id',
    DESCRIPTION = 'description',
    MAX_SLOTS = 'maxSlots',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class FindAllWorkspaceDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({ description: 'Sort field', enum: SORT_FIELD_WORKSPACE })
    @IsOptionalCustom()
    @IsString({ message: 'SortField must be a string' })
    sortField?: SORT_FIELD_WORKSPACE;
}
