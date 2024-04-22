import { PartialType } from '@nestjs/swagger';
import { IsOptionalCustom } from 'src/decorator/validator';

import { UserRole } from '../entities/user.entity';
import { CreateUserDto } from './create-user.dto';

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
