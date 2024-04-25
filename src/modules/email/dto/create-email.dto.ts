import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateEmailDto {
    @ApiProperty({ description: 'Email address', example: 'john@example.com' })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createEmail.email.required') })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.createEmail.email.isEmail') })
    readonly email: string;

    @ApiProperty({
        description: 'ID of the associated customer',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createEmail.customerId.required') })
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createEmail.customerId.isUUID') })
    readonly customerId: string;
}
