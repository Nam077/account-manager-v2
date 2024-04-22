import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDate, IsDecimal, IsBoolean, IsString, IsOptional, Length, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RentalStatus } from '../entities/rental.entity';

export class CreateRentalDto {
    @ApiProperty({ description: 'Customer id', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    customerId: string;

    @ApiProperty({ description: 'Account price id', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsUUID()
    accountPriceId: string;

    @ApiProperty({
        description: 'Workspace id',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsOptional()
    @IsUUID()
    workspaceId?: string;

    @ApiProperty({ description: 'Email id', example: '123e4567-e89b-12d3-a456-426614174003' })
    @IsUUID()
    emailId: string;

    @ApiProperty({ description: 'Start date of the rental', type: 'string', format: 'date', example: '2024-04-01' })
    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @ApiProperty({ description: 'End date of the rental', type: 'string', format: 'date', example: '2024-04-30' })
    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @ApiProperty({ description: 'Status of the rental', example: RentalStatus.ACTIVE })
    @IsEnum(RentalStatus)
    status: RentalStatus;

    @ApiProperty({ description: 'Note of the rental', required: false, example: 'Extra chairs included' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ description: 'Total price of the rental', type: 'number', example: 299.99 })
    @IsNumber({ maxDecimalPlaces: 2 })
    totalPrice: number;

    @ApiProperty({ description: 'Payment amount', type: 'number', example: 150.0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    paymentAmount: number;

    @ApiProperty({ description: 'Warranty fee', type: 'number', example: 50.0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    warrantyFee: number;

    @ApiProperty({ description: 'Discount', type: 'number', example: 20.0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    discount: number;

    @ApiProperty({
        description: 'Payment method',
        default: 'cash',
        example: 'credit card',
        enum: ['cash', 'credit card', 'bank transfer'],
    })
    @IsString()
    @Length(3, 255)
    paymentMethod: string;
}
