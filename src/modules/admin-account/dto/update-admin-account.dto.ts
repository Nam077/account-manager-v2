import { PartialType } from '@nestjs/swagger';
import { IsOptionalCustom } from 'src/decorator/validator';

import { CreateAdminAccountDto } from './create-admin-account.dto';

export class UpdateAdminAccountDto extends PartialType(CreateAdminAccountDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    value: string;

    @IsOptionalCustom()
    accountId: string;
}
