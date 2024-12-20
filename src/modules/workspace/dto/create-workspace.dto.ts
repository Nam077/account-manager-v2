import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { WorkspaceTypeEnums } from '../../../common';
import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateWorkspaceDto {
    @ApiProperty({
        description: 'Description of the workspace',
        example: 'Workspace Description',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.description.isNotEmpty'),
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.description.isString') })
    readonly description: string;

    @ApiProperty({
        description: 'Maximum customers allowed in the workspace',
        example: 10,
    })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.maxSlots.isNotEmpty') })
    @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.maxSlots.isInt') })
    @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.maxSlots.min') })
    readonly maxSlots: number;

    @ApiProperty({
        description: 'Admin account ID associated with the workspace',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.adminAccountId.isNotEmpty'),
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.adminAccountId.isUUID'),
    })
    readonly adminAccountId: string;

    @ApiProperty({
        description: 'Type of the workspace',
        example: WorkspaceTypeEnums.BUSINESS,
        enum: WorkspaceTypeEnums,
    })
    @IsEnum(WorkspaceTypeEnums, {
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspace.type.isEnum'),
    })
    readonly type: WorkspaceTypeEnums;
}
