import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateAccountDto {
    @ApiProperty({ description: 'Name of the account', example: 'Account Name' })
    @IsNotEmpty({ message: 'validation.account.name.required' })
    @IsString({
        message: 'validation.account.name.isString',
    })
    @Length(1, 255, { message: 'validation.account.name.length' })
    name: string;

    @ApiProperty({
        description: 'Description of the account',
        example: 'Account Description',
    })
    @IsNotEmpty({
        message: 'validation.account.description.required',
    })
    @IsString({
        message: 'validation.account.description.isString',
    })
    @Length(1, 255)
    description: string;

    @ApiProperty({
        description: 'ID of the associated account category',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({
        message: 'validation.account.accountCategoryId.required',
    })
    @IsUUID('all', { message: 'validation.account.accountCategoryId.isUUID' })
    accountCategoryId: string;
}
