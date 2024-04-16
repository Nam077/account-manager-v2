import { IsNotEmpty, IsString, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminAccountDto {
    @ApiProperty({ description: 'Email of the account', example: 'admin@example.com' })
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiProperty({ description: 'Value of the account', example: 'admin-value' })
    @IsNotEmpty()
    @IsString()
    readonly value: string;

    @ApiProperty({ description: 'ID of the associated account', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    readonly accountId: string;
}
