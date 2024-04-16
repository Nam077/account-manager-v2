import { PartialType } from '@nestjs/swagger';
import { CreateAccountCategoryDto } from './create-account-category.dto';

export class UpdateAccountCategoryDto extends PartialType(CreateAccountCategoryDto) {}
