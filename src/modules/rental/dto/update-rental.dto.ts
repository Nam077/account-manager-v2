import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { IsOptionalCustom, RentalStatus } from '../../../common';
import { I18nTranslations } from '../../../i18n/i18n.generated';

export class UpdateRentalDto {
    @ApiPropertyOptional({
        description: 'Email id',
        example: '123e4567-e89b-12d3-a456-426614174003',
    })
    @IsOptionalCustom()
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRental.emailId.isUUID') })
    emailId?: string;

    @ApiPropertyOptional({
        description: 'Status of the rental',
        example: RentalStatus.ACTIVE,
    })
    @IsOptionalCustom()
    @IsEnum(RentalStatus, { message: i18nValidationMessage<I18nTranslations>('validation.createRental.status.isEnum') })
    status?: RentalStatus;

    @ApiPropertyOptional({
        description: 'End date of the rental',
        type: 'string',
        format: 'date',
        example: '2024-04-01',
    })
    @Type(() => Date)
    @IsOptionalCustom()
    @IsDate({ message: i18nValidationMessage<I18nTranslations>('validation.createRental.endDate.isDate') })
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Workspace id',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsOptional()
    @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.createRental.workspaceId.isUUID') })
    workspaceId?: string;
}
