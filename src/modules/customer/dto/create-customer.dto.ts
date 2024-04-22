import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Name of the customer', example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @ApiProperty({ description: 'Email of the customer', example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiProperty({ description: 'Phone of the customer', example: '123456789' })
    @IsNotEmpty()
    @IsString()
    readonly phone: string;

    @ApiProperty({ description: 'Address of the customer', example: '123 Main St, City' })
    @IsOptional()
    @IsString()
    readonly address: string;

    @ApiProperty({ description: 'Company of the customer', example: 'ABC Corp' })
    @IsOptional()
    @IsString()
    readonly company: string;

    @ApiProperty({ description: 'Description of the customer', example: 'Regular customer' })
    @IsOptional()
    @IsString()
    readonly description: string;
}
