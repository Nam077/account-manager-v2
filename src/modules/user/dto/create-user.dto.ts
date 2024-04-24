import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

import { UserRole } from '../../../common';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
    @IsString({ message: 'validation.createUser.name.isString' })
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email of the user',
    })
    @IsEmail({}, { message: 'validation.createUser.email.isEmail' })
    email: string;

    @ApiProperty({ example: 'StrongPassword123!', description: 'Password of the user' })
    @IsString({ message: 'validation.createUser.password.isString' })
    @Length(8, 50, { message: 'validation.createUser.password.length' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'validation.createUser.password.regex',
    })
    password: string;

    @ApiProperty({
        example: UserRole.USER,
        enum: UserRole,
        description: 'Role of the user',
        default: UserRole.USER,
    })
    @IsEnum(UserRole, { message: 'validation.createUser.role.isEnum' })
    @IsOptional()
    role?: UserRole = UserRole.USER;
}
