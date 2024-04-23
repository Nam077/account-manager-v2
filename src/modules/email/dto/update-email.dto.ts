import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';
import { CreateEmailDto } from './create-email.dto';

export class UpdateEmailDto extends PartialType(CreateEmailDto) {
    @IsOptionalCustom()
    readonly email: string;

    @IsOptionalCustom()
    readonly customerId: string;
}
