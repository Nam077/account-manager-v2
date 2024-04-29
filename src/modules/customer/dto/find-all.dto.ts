import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { FindAllDtoAbstract } from '../../../common';
import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';

enum SORT_FIELD_CUSTOMER {
    ID = 'id',
    NAME = 'name',
    EMAIL = 'email',
    PHONE = 'phone',
    ADDRESS = 'address',
    COMPANY = 'company',
    DESCRIPTION = 'description',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export class FindAllCustomerDto extends FindAllDtoAbstract {
    @ApiPropertyOptional({
        description: 'Sort field',
        example: 'name',
        enum: SORT_FIELD_CUSTOMER,
    })
    @IsOptionalCustom()
    @IsIn(Object.values(SORT_FIELD_CUSTOMER), { message: 'SortField must be one of the allowed values' })
    sortField?: SORT_FIELD_CUSTOMER;
}
