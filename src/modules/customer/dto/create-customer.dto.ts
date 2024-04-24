import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Name of the customer', example: 'John Doe' })
    @IsNotEmpty({ message: 'validation.createCustomer.name.required' })
    @IsString({ message: 'validation.createCustomer.name.isString' })
    readonly name: string;

    @ApiProperty({
        description: 'Email of the customer',
        example: 'john@example.com',
    })
    @IsNotEmpty({ message: 'validation.createCustomer.email.required' })
    @IsEmail({}, { message: 'validation.createCustomer.email.isEmail' })
    readonly email: string;

    @ApiProperty({ description: 'Phone of the customer', example: '123456789' })
    @IsNotEmpty({ message: 'validation.createCustomer.phone.required' })
    @IsString({ message: 'validation.createCustomer.phone.isString' })
    readonly phone: string;

    @ApiProperty({
        description: 'Address of the customer',
        example: '123 Main St, City',
    })
    @IsOptional()
    @IsString({ message: 'validation.createCustomer.address.isString' })
    readonly address: string;

    @ApiProperty({ description: 'Company of the customer', example: 'ABC Corp' })
    @IsOptional()
    @IsString({ message: 'validation.createCustomer.company.isString' })
    readonly company: string;

    @ApiProperty({
        description: 'Description of the customer',
        example: 'Regular customer',
    })
    @IsOptional()
    @IsString({ message: 'validation.createCustomer.description.isString' })
    readonly description: string;
}
