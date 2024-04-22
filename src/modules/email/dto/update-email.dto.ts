import { PartialType } from '@nestjs/swagger';
import { IsOptionalCustom } from 'src/decorator/validator';

import { CreateEmailDto } from './create-email.dto';

export class UpdateEmailDto extends PartialType(CreateEmailDto) {
    @IsOptionalCustom()
    readonly email: string;

    @IsOptionalCustom()
    readonly customerId: string;
}
