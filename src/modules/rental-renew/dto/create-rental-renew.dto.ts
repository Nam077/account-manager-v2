import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateRentalRenewDto {
    @ApiProperty({ description: 'ID of the rental', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.rentalId.isNotEmpty'),
    })
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.rentalId.isUUID') })
    readonly rentalId: string;

    @ApiProperty({
        description: 'Account price id',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createRental.accountPriceId.isUUID'),
    })
    accountPriceId: string;

    @ApiProperty({ description: 'Warranty fee', example: 50.0 })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.warrantyFee.isNotEmpty'),
    })
    @IsNumber(
        {},
        { message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.warrantyFee.isNumber') },
    )
    readonly warrantyFee: number;

    @ApiProperty({ description: 'Discount', example: 20.0 })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.discount.isNotEmpty'),
    })
    @IsNumber(
        {},
        { message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.discount.isNumber') },
    )
    readonly discount: number;

    @ApiProperty({ description: 'Payment method', example: 'cash' })
    @IsOptional()
    @IsString({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.paymentMethod.isString'),
    })
    readonly paymentMethod?: string;

    @ApiProperty({ description: 'Note regarding the renewal', example: 'Renewed for another month' })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.note.isString') })
    readonly note?: string;
}
