import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateWorkspaceDto {
    @ApiProperty({
        description: 'Description of the workspace',
        example: 'Workspace Description',
    })
    @IsNotEmpty({ message: 'validation.createWorkspace.description.isNotEmpty' })
    @IsString({ message: 'validation.createWorkspace.description.isString' })
    readonly description: string;

    @ApiProperty({
        description: 'Maximum customers allowed in the workspace',
        example: 10,
    })
    @IsNotEmpty({ message: 'validation.createWorkspace.maxSlots.isNotEmpty' })
    @IsInt({ message: 'validation.createWorkspace.maxSlots.isInt' })
    @Min(1, { message: 'validation.createWorkspace.maxSlots.min' })
    readonly maxSlots: number;

    @ApiProperty({
        description: 'Admin account ID associated with the workspace',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: 'validation.createWorkspace.adminAccountId.isNotEmpty' })
    @IsUUID('all', { message: 'validation.createWorkspace.adminAccountId.isUUID' })
    readonly adminAccountId: string;
}
