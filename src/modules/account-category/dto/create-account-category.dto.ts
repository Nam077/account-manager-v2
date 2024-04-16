import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountCategoryDto {
    @ApiProperty({ description: 'Name of the account category', example: 'Category Name' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    name: string;

    @ApiProperty({ description: 'Description of the account category', example: 'Category Description' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    description: string;
}
