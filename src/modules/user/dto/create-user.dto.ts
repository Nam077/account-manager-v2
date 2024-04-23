import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

import { UserRole } from '../../../common/enum/user-role.enum';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email of the user',
    })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password of the user' })
    @IsString()
    password: string;

    @ApiProperty({
        example: UserRole.USER,
        enum: UserRole,
        description: 'Role of the user',
        default: UserRole.USER,
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.USER;
}
