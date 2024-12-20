import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common';
import { CreateAccountCategoryDto } from './create-account-category.dto';

export class UpdateAccountCategoryDto extends PartialType(CreateAccountCategoryDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;
}
