import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateAdminAccountDto {
    @ApiProperty({
        description: 'Email of the account',
        example: 'admin@example.com',
    })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.email.required') })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.email.isEmail') })
    public readonly email: string;

    @ApiProperty({ description: 'Value of the account', example: 'admin-value' })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.value.required') })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.value.isString') })
    public readonly value: string;

    @ApiProperty({
        description: 'ID of the associated account',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.accountId.required'),
    })
    @IsUUID(undefined, {
        message: i18nValidationMessage<I18nTranslations>('validation.createAdminAccount.accountId.isUUID'),
    })
    public readonly accountId: string;
}
