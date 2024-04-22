import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRefreshTokenDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'The refresh token' })
    @IsString()
    token: string;

    @ApiProperty({
        example: '{"userId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"}',
        description: 'Data associated with the refresh token',
    })
    @IsString()
    @IsOptional()
    data?: string;

    @ApiProperty({
        example: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        description: 'The ID of the user associated with the refresh token',
    })
    @IsUUID()
    userId: string;
}
