import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class RegisterDto {
    @ApiProperty({
        description: 'User email',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.register.email.isEmail') })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.register.email.required') })
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'strongPassword123',
        minLength: 8,
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.register.password.isString') })
    @MinLength(8, { message: i18nValidationMessage<I18nTranslations>('validation.register.password.minLength') })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.register.password.required') })
    password: string;

    @ApiProperty({
        description: 'User name',
        example: 'John Doe',
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.register.name.isString') })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.register.name.required') })
    name: string;
}
