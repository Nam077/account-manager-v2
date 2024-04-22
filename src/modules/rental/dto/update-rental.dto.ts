import { PartialType } from '@nestjs/swagger';
import { CreateRentalDto } from './create-rental.dto';
import { RentalStatus } from '../entities/rental.entity';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateRentalDto extends PartialType(CreateRentalDto) {
    @IsOptionalCustom()
    customerId: string;
    @IsOptionalCustom()
    accountPriceId: string;

    workspaceId?: string;
    @IsOptionalCustom()
    emailId: string;
    @IsOptionalCustom()
    startDate: Date;
    @IsOptionalCustom()
    endDate: Date;
    @IsOptionalCustom()
    status: RentalStatus;
    @IsOptionalCustom()
    note?: string;
    @IsOptionalCustom()
    totalPrice: number;
    @IsOptionalCustom()
    paymentAmount: number;
    @IsOptionalCustom()
    warrantyFee: number;
    @IsOptionalCustom()
    discount: number;
    @IsOptionalCustom()
    paymentMethod: string;
}
