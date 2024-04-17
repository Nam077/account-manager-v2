import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceEmailDto } from './create-workspace-email.dto';
import { IsOptionalCustom } from 'src/decorator/validator';

export class UpdateWorkspaceEmailDto extends PartialType(CreateWorkspaceEmailDto) {
    @IsOptionalCustom()
    readonly workspaceId: string;
    @IsOptionalCustom()
    readonly emailId: string;
}
