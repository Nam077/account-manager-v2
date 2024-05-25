import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { ToCapitalize } from '../../../common';
import { I18nTranslations } from '../../../i18n/i18n.generated';

export class CreateRentalTypeDto {
    @ApiProperty({
        description: 'Name of the rental type',
        example: 'Rental Type Name',
    })
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.name.isNotEmpty') })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.name.isString') })
    @ToCapitalize()
    name: string;

    @ApiProperty({
        description: 'Description of the rental type',
        example: 'Rental Type Description',
    })
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.description.isString') })
    description: string;

    @ApiProperty({
        description: 'Maximum slots allowed in the rental type',
        example: 10,
    })
    @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.maxSlots.isInt') })
    @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.maxSlots.min') })
    maxSlots: number;


    
}
