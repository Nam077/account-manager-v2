import { IsNotEmpty, IsString, Length, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
    @ApiProperty({ description: 'Name of the account', example: 'Account Name' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    name: string;

    @ApiProperty({ description: 'Description of the account', example: 'Account Description' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    description: string;

    @ApiProperty({
        description: 'ID of the associated account category',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    accountCategoryId: string;
}
