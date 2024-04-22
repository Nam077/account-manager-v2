import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../decorator/validator';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;

    @IsOptionalCustom()
    accountCategoryId: string;
}
