import { PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;

    @IsOptionalCustom()
    accountCategoryId: string;
}
