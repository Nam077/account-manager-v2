import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../decorator/validator';
import { CreateWorkspaceEmailDto } from './create-workspace-email.dto';

export class UpdateWorkspaceEmailDto extends PartialType(CreateWorkspaceEmailDto) {
    @IsOptionalCustom()
    readonly workspaceId: string;
    @IsOptionalCustom()
    readonly emailId: string;
}
