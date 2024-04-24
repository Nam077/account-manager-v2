import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { IsEarlierThanDate } from '../../../common';
import { RentalStatus } from '../entities/rental.entity';

export class CreateRentalDto {
    @ApiProperty({
        description: 'Customer id',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('all', { message: 'validation.createRental.customerId.isUUID' })
    customerId: string;

    @ApiProperty({
        description: 'Account price id',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID('all', { message: 'validation.createRental.accountPriceId.isUUID' })
    accountPriceId: string;

    @ApiProperty({
        description: 'Workspace id',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsOptional()
    @IsUUID('all', { message: 'validation.createRental.workspaceId.isUUID' })
    workspaceId?: string;

    @ApiProperty({
        description: 'Email id',
        example: '123e4567-e89b-12d3-a456-426614174003',
    })
    @IsUUID('all', { message: 'validation.createRental.emailId.isUUID' })
    emailId: string;

    @ApiProperty({
        description: 'Start date of the rental',
        type: 'string',
        format: 'date',
        example: '2024-04-01',
    })
    @Type(() => Date)
    @IsDate({ message: 'validation.createRental.startDate.isDate' })
    @IsEarlierThanDate('endDate', { message: 'validation.createRental.startDate.isEarlierThanDate' })
    startDate: Date;

    @ApiProperty({
        description: 'End date of the rental',
        type: 'string',
        format: 'date',
        example: '2024-04-30',
    })
    @Type(() => Date)
    @IsDate({ message: 'validation.createRental.endDate.isDate' })
    endDate: Date;

    @ApiProperty({
        description: 'Status of the rental',
        example: RentalStatus.ACTIVE,
    })
    @IsEnum(RentalStatus, { message: 'validation.createRental.status.isEnum' })
    status: RentalStatus;

    @ApiProperty({
        description: 'Note of the rental',
        required: false,
        example: 'Extra chairs included',
    })
    @IsOptional()
    @IsString({ message: 'validation.createRental.note.isString' })
    note?: string;

    @ApiProperty({
        description: 'Total price of the rental',
        type: 'number',
        example: 299.99,
    })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'validation.createRental.totalPrice.isNumber' })
    totalPrice: number;

    @ApiProperty({
        description: 'Payment amount',
        type: 'number',
        example: 150.0,
    })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'validation.createRental.paymentAmount.isNumber' })
    paymentAmount: number;

    @ApiProperty({ description: 'Warranty fee', type: 'number', example: 50.0 })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'validation.createRental.warrantyFee.isNumber' })
    warrantyFee: number;

    @ApiProperty({ description: 'Discount', type: 'number', example: 20.0 })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'validation.createRental.discount.isNumber' })
    discount: number;

    @ApiProperty({
        description: 'Payment method',
        default: 'cash',
        example: 'credit card',
        enum: ['cash', 'credit card', 'bank transfer'],
    })
    @IsString({ message: 'validation.createRental.paymentMethod.isString' })
    @Length(3, 255, { message: 'validation.createRental.paymentMethod.length' })
    paymentMethod: string;
}
