import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEmailDto {
    @ApiProperty({ description: 'Email address', example: 'john@example.com' })
    @IsNotEmpty({ message: 'validation.createEmail.email.required' })
    @IsEmail({}, { message: 'validation.createEmail.email.isEmail' })
    readonly email: string;

    @ApiProperty({
        description: 'ID of the associated customer',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: 'validation.createEmail.customerId.required' })
    @IsUUID(undefined, { message: 'validation.createEmail.customerId.isUUID' })
    readonly customerId: string;
}
