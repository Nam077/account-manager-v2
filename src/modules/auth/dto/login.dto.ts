import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'johndoe@example.com',
        description: 'The email of the user',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'Nampronam123!',
        description: 'The password of the user',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password: string;
}
