import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateAccountPriceDto {
    @ApiProperty({ description: 'Price of the account', example: 100 })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.price.required') })
    @IsNumber({}, { message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.price.isNumber') })
    @Min(0, { message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.price.min') })
    readonly price: number;

    @ApiProperty({
        description: 'ID of the associated account',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.accountId.required'),
    })
    @IsUUID(undefined, {
        message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.accountId.isUUID'),
    })
    readonly accountId: string;

    @ApiProperty({
        description: 'ID of the associated rental type',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.rentalTypeId.required'),
    })
    @IsUUID(undefined, {
        message: i18nValidationMessage<I18nTranslations>('validation.createAccountPrice.rentalTypeId.isUUID'),
    })
    readonly rentalTypeId: string;
}
