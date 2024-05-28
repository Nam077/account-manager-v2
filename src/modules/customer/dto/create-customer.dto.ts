import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Name of the customer', example: 'John Doe' })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.name.required') })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.name.isString') })
    readonly name: string;

    @ApiProperty({
        description: 'Email of the customer',
        example: 'john@example.com',
    })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.email.required') })
    @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.email.isEmail') })
    readonly email: string;

    @ApiProperty({
        description: 'Description of the customer',
        example: 'Regular customer',
    })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.description.isString') })
    readonly description: string;
}
