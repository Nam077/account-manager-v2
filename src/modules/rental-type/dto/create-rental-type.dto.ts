import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { ToCapitalize } from '../../../common';
import { RentalTypeEnums } from '../../../common/enum/rental-type.enum';
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
        description: 'Type of the rental',
        example: RentalTypeEnums.PERSONAL,
        enum: RentalTypeEnums,
    })
    @IsEnum(RentalTypeEnums, {
        message: i18nValidationMessage<I18nTranslations>('validation.createRentalType.type.isEnum'),
    })
    type: RentalTypeEnums;
}
