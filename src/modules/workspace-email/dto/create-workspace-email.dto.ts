import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateWorkspaceEmailDto {
    @ApiProperty({ description: 'ID of the workspace', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    readonly workspaceId: string;

    @ApiProperty({ description: 'ID of the email', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsNotEmpty()
    @IsUUID()
    readonly emailId: string;
}
