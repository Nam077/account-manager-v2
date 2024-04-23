import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAccountCategoryDto {
    @ApiProperty({
        description: 'Name of the account category',
        example: 'Category Name',
    })
    @IsNotEmpty({ message: 'validation.accountCategory.name.required' })
    @IsString({ message: 'validation.accountCategory.name.isString' })
    @Length(1, 255, { message: 'validation.accountCategory.name.length' })
    name: string;

    @ApiProperty({
        description: 'Description of the account category',
        example: 'Category Description',
    })
    @IsNotEmpty({ message: 'validation.accountCategory.description.required' })
    @IsString({ message: 'validation.accountCategory.description.isString' })
    @Length(1, 255, { message: 'validation.accountCategory.description.length' })
    description: string;
}
