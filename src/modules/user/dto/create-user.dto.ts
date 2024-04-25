import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserRole } from '../../../common';
import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createUser.name.isString') })
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email of the user',
    })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.createUser.email.isEmail') })
    email: string;

    @ApiProperty({ example: 'StrongPassword123!', description: 'Password of the user' })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createUser.password.isString') })
    @Length(8, 50, { message: i18nValidationMessage<I18nTranslations>('validation.createUser.password.lengthAccept') })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: i18nValidationMessage<I18nTranslations>('validation.createUser.password.regex'),
    })
    password: string;

    @ApiProperty({
        example: UserRole.USER,
        enum: UserRole,
        description: 'Role of the user',
        default: UserRole.USER,
    })
    @IsEnum(UserRole, { message: i18nValidationMessage<I18nTranslations>('validation.createUser.role.isEnum') })
    @IsOptional()
    role?: UserRole = UserRole.USER;
}
