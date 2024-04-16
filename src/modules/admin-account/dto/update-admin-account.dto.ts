import { PartialType } from '@nestjs/swagger';
import { CreateAdminAccountDto } from './create-admin-account.dto';

export class UpdateAdminAccountDto extends PartialType(CreateAdminAccountDto) {}
