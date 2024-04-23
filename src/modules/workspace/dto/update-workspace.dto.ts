import { PartialType } from '@nestjs/swagger';

import { IsOptionalCustom } from '../../../common/decorator/validator.decorator';
import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {
    @IsOptionalCustom()
    readonly description: string;
    @IsOptionalCustom()
    readonly maxSlots: number;
    @IsOptionalCustom()
    readonly adminAccountId: string;
}
