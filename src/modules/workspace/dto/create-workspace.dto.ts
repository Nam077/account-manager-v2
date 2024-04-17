import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
    @ApiProperty({ description: 'Description of the workspace', example: 'Workspace Description' })
    @IsNotEmpty()
    @IsString()
    readonly description: string;

    @ApiProperty({ description: 'Maximum customers allowed in the workspace', example: 10 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    readonly maxSlots: number;

    @ApiProperty({
        description: 'Admin account ID associated with the workspace',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsString()
    readonly adminAccountId: string;
}
