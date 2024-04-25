import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class LoginDto {
    @ApiProperty({
        example: 'johndoe@example.com',
        description: 'The email of the user',
    })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.login.email.isEmail') })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.login.email.required') })
    email: string;

    @ApiProperty({
        example: 'Nampronam123!',
        description: 'The password of the user',
        minLength: 8,
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.login.password.isString') })
    @MinLength(8, { message: i18nValidationMessage<I18nTranslations>('validation.login.password.minLength') })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.login.password.required') })
    password: string;
}
