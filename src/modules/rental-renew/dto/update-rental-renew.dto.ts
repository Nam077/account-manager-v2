import { PartialType } from '@nestjs/swagger';

import { CreateRentalRenewDto } from './create-rental-renew.dto';

export class UpdateRentalRenewDto extends PartialType(CreateRentalRenewDto) {}
