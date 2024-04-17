import { PartialType } from '@nestjs/swagger';
import { CreateAccountPriceDto } from './create-account-price.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateAccountPriceDto extends PartialType(CreateAccountPriceDto) {
    @IsOptionalCustom()
    readonly price: number;

    @IsOptionalCustom()
    readonly accountId: string;

    @IsOptionalCustom()
    readonly rentalTypeId: string;
}
