import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
    @IsOptionalCustom()
    readonly name: string;

    @IsOptionalCustom()
    readonly email: string;

    @IsOptionalCustom()
    readonly phone: string;

    @IsOptionalCustom()
    readonly address: string;

    @IsOptionalCustom()
    readonly company: string;

    @IsOptionalCustom()
    readonly description: string;
}
