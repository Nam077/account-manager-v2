import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateWorkspaceEmailDto {
    @ApiProperty({
        description: 'ID of the workspace',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspaceEmail.workspaceId.isNotEmpty'),
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspaceEmail.workspaceId.isUUID'),
    })
    readonly workspaceId: string;

    @ApiProperty({
        description: 'ID of the email',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsNotEmpty({
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspaceEmail.emailId.isNotEmpty'),
    })
    @IsUUID('all', {
        message: i18nValidationMessage<I18nTranslations>('validation.createWorkspaceEmail.emailId.isUUID'),
    })
    readonly emailId: string;
}
