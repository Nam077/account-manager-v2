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

    @ApiProperty({ description: 'Phone of the customer', example: '123456789' })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.phone.required') })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.phone.isString') })
    readonly phone: string;

    @ApiProperty({
        description: 'Address of the customer',
        example: '123 Main St, City',
    })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.address.isString') })
    readonly address: string;

    @ApiProperty({ description: 'Company of the customer', example: 'ABC Corp' })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.company.isString') })
    readonly company: string;

    @ApiProperty({
        description: 'Description of the customer',
        example: 'Regular customer',
    })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createCustomer.description.isString') })
    readonly description: string;
}
