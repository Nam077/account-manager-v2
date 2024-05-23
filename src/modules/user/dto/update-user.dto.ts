import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom, UserRole } from '../../../common';
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
