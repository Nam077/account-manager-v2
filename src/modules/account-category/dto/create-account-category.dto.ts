import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAccountCategoryDto {
    @ApiProperty({
        description: 'Name of the account category',
        example: 'Category Name',
    })
    @IsNotEmpty({ message: i18nValidationMessage('validation.accountCategory.name.required') })
    @IsString({ message: i18nValidationMessage('validation.accountCategory.name.isString') })
    @Length(1, 255, { message: i18nValidationMessage('validation.accountCategory.name.lengthAccept') })
    name: string;

    @ApiProperty({
        description: 'Description of the account category',
        example: 'Category Description',
    })
    @IsNotEmpty({ message: i18nValidationMessage('validation.accountCategory.description.required') })
    @IsString({ message: i18nValidationMessage('validation.accountCategory.description.isString') })
    @Length(1, 255, { message: i18nValidationMessage('validation.accountCategory.description.lengthAccept') })
    description: string;
}
