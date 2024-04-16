import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email of the user' })
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