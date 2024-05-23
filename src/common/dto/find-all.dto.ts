import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { IS_WITH_DELETED, SORT_ORDER } from '../enum';

export abstract class FindAllDtoAbstract {
    @ApiPropertyOptional({ description: 'Search query', example: '' })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    public query?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @IsNumber({}, { message: 'Page must be a number' })
    public page?: number;

    @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @IsNumber({}, { message: 'Limit must be a number' })
    public limit?: number;

    @ApiPropertyOptional({
        description: 'Is with deleted items',
        example: false,
        enum: IS_WITH_DELETED,
    })
    @IsOptional()
    @IsIn(Object.values(IS_WITH_DELETED))
    public withDeleted?: IS_WITH_DELETED;

    @ApiPropertyOptional({
        description: 'Sort order',
        example: SORT_ORDER.ASC,
        enum: SORT_ORDER,
    })
    @IsOptional()
    @IsIn(Object.values(SORT_ORDER))
    public sort?: SORT_ORDER;
}
