import { PartialType } from '@nestjs/swagger';
import { CreateEmailDto } from './create-email.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateEmailDto extends PartialType(CreateEmailDto) {
    @IsOptionalCustom()
    readonly email: string;

    @IsOptionalCustom()
    readonly customerId: string;
}
