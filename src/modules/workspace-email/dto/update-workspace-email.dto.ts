import { PartialType } from '@nestjs/swagger';

import { RentalStatus } from '../../../common';
import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';
import { CreateWorkspaceEmailDto } from './create-workspace-email.dto';

export class UpdateWorkspaceEmailDto extends PartialType(CreateWorkspaceEmailDto) {
    @IsOptionalCustom()
    readonly workspaceId?: string;

    @IsOptionalCustom()
    readonly emailId?: string;

    readonly status?: RentalStatus;
}
