import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateRentalRenewDto {
    @ApiProperty({ description: 'ID of the rental', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.rentalId.isNotEmpty'),
    })
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.rentalId.isUUID') })
    readonly rentalId: string;

    @ApiProperty({ description: 'New end date of the rental', example: '2024-04-30' })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.newEndDate.isNotEmpty'),
    })
    @IsDate({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.newEndDate.isDate') })
    readonly newEndDate: Date;

    @ApiProperty({ description: 'Last start date of the rental', example: '2024-03-01' })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.lastStartDate.isNotEmpty'),
    })
    @IsDate({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.lastStartDate.isDate') })
    readonly lastStartDate: Date;

    @ApiProperty({ description: 'Total price of the rental', example: 299.99 })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.totalPrice.isNotEmpty'),
    })
    @IsNumber(
        {},
        { message: i18nValidationMessage<I18nTranslations>('validation.createRentalRenew.totalPrice.isNumber') },
    )
    readonly totalPrice: number;

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
