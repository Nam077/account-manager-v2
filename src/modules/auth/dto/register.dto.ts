import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        description: 'User email',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'validation.register.email.isEmail' })
    @IsNotEmpty({ message: 'validation.register.email.required' })
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'strongPassword123',
        minLength: 8,
    })
    @IsString({ message: 'validation.register.password.isString' })
    @MinLength(8, { message: 'validation.register.password.minLength' })
    @IsNotEmpty({ message: 'validation.register.password.required' })
    password: string;

    @ApiProperty({
        description: 'User name',
        example: 'John Doe',
    })
    @IsString({ message: 'validation.register.name.isString' })
    @IsNotEmpty({ message: 'validation.register.name.required' })
    name: string;
}
