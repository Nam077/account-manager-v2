export interface ApiResponse<T> {
    message?: string;
    data?: T | T[] | PaginatedData<T>;
}

export interface PaginatedData<T> {
    items: T[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    nextPage?: number;
}
