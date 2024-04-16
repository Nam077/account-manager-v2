import { PartialType } from '@nestjs/swagger';
import { CreateAccountCategoryDto } from './create-account-category.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateAccountCategoryDto extends PartialType(CreateAccountCategoryDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    description: string;
}
