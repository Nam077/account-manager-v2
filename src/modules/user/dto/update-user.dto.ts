import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../entities/user.entity';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptionalCustom()
    name: string;

    @IsOptionalCustom()
    email: string;

    @IsOptionalCustom()
    password: string;

    @IsOptionalCustom()
    role?: UserRole = UserRole.USER;
}
