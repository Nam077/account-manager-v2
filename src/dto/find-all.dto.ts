import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

enum SORT_ORDER {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class FindAllDto {
    @ApiPropertyOptional({ description: 'Search query', example: 'example' })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    @IsNotEmpty({ message: 'Query cannot be empty' })
    query?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @IsNumber({}, { message: 'Page must be a number' })
    page?: number;

    @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @IsNumber({}, { message: 'Limit must be a number' })
    limit?: number;

    @ApiPropertyOptional({ description: 'Sort order', example: SORT_ORDER.ASC, enum: SORT_ORDER })
    @IsOptional()
    @IsIn(Object.values(SORT_ORDER))
    sort?: SORT_ORDER;

    @ApiPropertyOptional({ description: 'Sort field', example: 'name' })
    @IsOptional()
    @IsString({ message: 'SortField must be a string' })
    @IsNotEmpty({ message: 'SortField cannot be empty' })
    sortField?: string;
}
