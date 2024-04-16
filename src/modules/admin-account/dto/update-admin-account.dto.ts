import { PartialType } from '@nestjs/swagger';
import { CreateAdminAccountDto } from './create-admin-account.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateAdminAccountDto extends PartialType(CreateAdminAccountDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    value: string;

    @IsOptionalCustom()
    accountId: string;
}
