import { PartialType } from '@nestjs/swagger';
import { IsOptionalCustom } from 'src/common/decorator/validator.decorator';

import { UserRole } from '../../../common/enum/user-role.enum';
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
