import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../decorator/validator';
import { CreateAccountPriceDto } from './create-account-price.dto';

export class UpdateAccountPriceDto extends PartialType(CreateAccountPriceDto) {
    @IsOptionalCustom()
    readonly price: number;

    @IsOptionalCustom()
    readonly accountId: string;

    @IsOptionalCustom()
    readonly rentalTypeId: string;
}
