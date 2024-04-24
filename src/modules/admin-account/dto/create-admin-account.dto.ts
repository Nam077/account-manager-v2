import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAdminAccountDto {
    @ApiProperty({
        description: 'Email of the account',
        example: 'admin@example.com',
    })
    @IsNotEmpty({ message: 'validation.adminAccount.email.required' })
    @IsEmail({}, { message: 'validation.adminAccount.email.isEmail' })
    readonly email: string;

    @ApiProperty({ description: 'Value of the account', example: 'admin-value' })
    @IsNotEmpty({ message: 'validation.adminAccount.value.required' })
    @IsString({ message: 'validation.adminAccount.value.isString' })
    readonly value: string;

    @ApiProperty({
        description: 'ID of the associated account',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: 'validation.adminAccount.accountId.required' })
    @IsUUID(undefined, { message: 'validation.adminAccount.accountId.isUUID' })
    readonly accountId: string;
}
