import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract, IsOptionalCustom } from '../../../common';

enum SORT_FIELD_ADMIN_ACCOUNT {
    ID = 'id',
    EMAIL = 'email',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    DELETED_AT = 'deletedAt',
}

export class FindAllAdminAccountDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        enum: SORT_FIELD_ADMIN_ACCOUNT,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_ADMIN_ACCOUNT))
    sortField?: SORT_FIELD_ADMIN_ACCOUNT;
}
