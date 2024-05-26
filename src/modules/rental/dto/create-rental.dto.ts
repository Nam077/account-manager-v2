import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { RentalStatus } from '../../../common';
import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateRentalDto {
    @ApiProperty({
        description: 'Customer id',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRental.customerId.isUUID') })
    customerId: string;

    @ApiProperty({
        description: 'Account price id',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createRental.accountPriceId.isUUID'),
    })
    accountPriceId: string;

    @ApiProperty({
        description: 'Workspace id',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsOptional()
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRental.workspaceId.isUUID') })
    workspaceId?: string;

    @ApiProperty({
        description: 'Email id',
        example: '123e4567-e89b-12d3-a456-426614174003',
    })
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRental.emailId.isUUID') })
    emailId: string;

    @ApiProperty({
        description: 'Start date of the rental',
        type: 'string',
        format: 'date',
        example: '2024-04-01',
    })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage<I18nTranslations>('validation.createRental.startDate.isDate') })
    startDate: Date;

    @ApiProperty({
        description: 'Status of the rental',
        example: RentalStatus.ACTIVE,
    })
    @IsEnum(RentalStatus, { message: i18nValidationMessage<I18nTranslations>('validation.createRental.status.isEnum') })
    status: RentalStatus;

    @ApiProperty({
        description: 'Note of the rental',
        required: false,
        example: 'Extra chairs included',
    })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createRental.note.isString') })
    note?: string;

    @ApiProperty({ description: 'Warranty fee', type: 'number', example: 50.0 })
    @IsNumber(
        { maxDecimalPlaces: 2 },
        { message: i18nValidationMessage<I18nTranslations>('validation.createRental.warrantyFee.isNumber') },
    )
    warrantyFee: number;

    @ApiProperty({ description: 'Discount', type: 'number', example: 20.0 })
    @IsNumber(
        { maxDecimalPlaces: 2 },
        { message: i18nValidationMessage<I18nTranslations>('validation.createRental.discount.isNumber') },
    )
    discount: number;

    @ApiProperty({
        description: 'Payment method',
        default: 'cash',
        example: 'credit card',
        enum: ['cash', 'credit card', 'bank transfer'],
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createRental.paymentMethod.isString') })
    @Length(3, 255, {
        message: i18nValidationMessage<I18nTranslations>('validation.createRental.paymentMethod.lengthAccept'),
    })
    paymentMethod: string;
}
