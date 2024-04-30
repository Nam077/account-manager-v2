import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common';
import { CreateRentalRenewDto } from './create-rental-renew.dto';

export class UpdateRentalRenewDto extends PartialType(CreateRentalRenewDto) {
    @IsOptionalCustom()
    readonly rentalId: string;
    @IsOptionalCustom()
    readonly newEndDate: Date;
    @IsOptionalCustom()
    readonly totalPrice: number;
    @IsOptionalCustom()
    readonly warrantyFee: number;
    @IsOptionalCustom()
    readonly discount: number;
    @IsOptionalCustom()
    readonly paymentMethod?: string;
    @IsOptionalCustom()
    readonly note?: string;
}
