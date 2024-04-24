import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'johndoe@example.com',
        description: 'The email of the user',
    })
    @IsEmail({}, { message: 'validation.login.email.isEmail' })
    @IsNotEmpty({ message: 'validation.login.email.required' })
    email: string;

    @ApiProperty({
        example: 'Nampronam123!',
        description: 'The password of the user',
        minLength: 8,
    })
    @IsString({ message: 'validation.login.password.isString' })
    @MinLength(8, { message: 'validation.login.password.minLength' })
    @IsNotEmpty({ message: 'validation.login.password.required' })
    password: string;
}
