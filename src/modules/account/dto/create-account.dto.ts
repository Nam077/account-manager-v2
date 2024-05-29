import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateAccountDto {
    @ApiProperty({ description: 'Name of the account', example: 'Account Name' })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createAccount.name.required') })
    @IsString({
        message: i18nValidationMessage<I18nTranslations>('validation.createAccount.name.isString'),
    })
    @Length(1, 255, { message: i18nValidationMessage<I18nTranslations>('validation.createAccount.name.lengthAccept') })
    name: string;

    @ApiProperty({
        description: 'Description of the account',
        example: 'Account Description',
    })
    @IsOptional()
    @IsString({
        message: i18nValidationMessage<I18nTranslations>('validation.createAccount.description.isString'),
    })
    description: string;

    @ApiProperty({
        description: 'ID of the associated account category',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createAccount.accountCategoryId.required'),
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createAccount.accountCategoryId.isUUID'),
    })
    accountCategoryId: string;
}
