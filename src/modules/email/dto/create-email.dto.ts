import { IsNotEmpty, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailDto {
    @ApiProperty({ description: 'Email address', example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiProperty({ description: 'ID of the associated customer', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    readonly customerId: string;
}
