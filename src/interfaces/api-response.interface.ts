import { HttpStatus } from '@nestjs/common';

/**
 * Represents the response from an API request.
 * @template T - The type of the data in the response.
 */
export interface ApiResponse<T> {
    message?: string;
    data?: T | T[] | PaginatedData<T>;
    status?: number | HttpStatus;
}

/**
 * Represents a paginated data response.
 * @template T - The type of items in the response.
 */
export interface PaginatedData<T> {
    items: T[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    nextPage?: number;
}
