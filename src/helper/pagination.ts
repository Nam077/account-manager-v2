import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from 'src/interfaces/api-response.interface';
import { log } from 'console';

/**
 * Parameters for finding data with pagination and search.
 */
interface FindAllParams {
    query?: string;
    page?: number;
    limit?: number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
}

/**
 * Represents the paginated data.
 */
interface PaginatedData<T> {
    currentPage: number;
    items: T[];
    perPage: number;
    totalItems: number;
    totalPages: number;
    nextPage: number | undefined;
}

export interface SearchField {
    tableName: string;
    fields: string[];
}
/**
 * Adds relations to the query builder.
 * @param queryBuilder - The query builder to modify.
 * @param tableName - The name of the table.
 * @param relations - The relations to add.
 */
function addRelationsToQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    tableName: string,
    relations?: string[],
): void {
    if (relations) {
        relations = relations.filter((relation) => {
            if (relation !== '' && relation !== null) {
                return relation;
            }
        });
        log('relations', relations);
        relations.forEach((relation) => {
            let entityAlias: string;
            let relationName: string;
            if (!relation.includes('.')) {
                entityAlias = tableName;
                relationName = relation;
            } else {
                [entityAlias, relationName] = relation.split('.');
            }
            queryBuilder.leftJoinAndSelect(`${entityAlias}.${relationName}`, relationName);
        });
    } else {
    }
}

const validateRelations = (searchFieldsInRelations: SearchField[], relations?: string[]): boolean => {
    if (searchFieldsInRelations.length > 0) {
        const requiredRelations = searchFieldsInRelations.map((sf) => sf.tableName);
        return requiredRelations.every((rr) => relations?.includes(rr));
    }
    return true;
};

export function findWithPaginationAndSearch<T>(
    repository: Repository<T>,
    findAllDto: FindAllParams,
    fields: string[],
    searchFieldsInRelations?: undefined,
    relations?: string[],
): Observable<ApiResponse<PaginatedData<T>>>;

export function findWithPaginationAndSearch<T>(
    repository: Repository<T>,
    findAllDto: FindAllParams,
    fields: string[],
    searchFieldsInRelations: SearchField[],
    relations: string[],
): Observable<ApiResponse<PaginatedData<T>>>;

/**
 * Finds data with pagination and search.
 * @param repository - The repository to query.
 * @param nameTable - The name of the table.
 * @param findAllDto - The parameters for finding data.
 * @param fields - The fields to search in.
 * @param searchFieldsInRelations - The fields to search in relations.
 * @param relations
 * @returns An observable of ApiResponse containing the paginated data.
 */
export function findWithPaginationAndSearch<T>(
    repository: Repository<T>,
    findAllDto: FindAllParams,
    fields: string[],
    searchFieldsInRelations: SearchField[] = [],
    relations?: string[],
): Observable<ApiResponse<PaginatedData<T>>> {
    if (!validateRelations(searchFieldsInRelations, relations)) {
        throw new HttpException(
            'Missing required relations for the specified search fields in relations.',
            HttpStatus.BAD_REQUEST,
        );
    }
    const nameTable = repository.metadata.tableName;
    const { query, page = 1, limit = 10, sort, sortField } = findAllDto;
    const queryBuilder = repository.createQueryBuilder(nameTable);
    if (query) {
        const lowercaseQuery = `%${query.toLowerCase()}%`;
        queryBuilder.where(
            new Brackets((qb) => {
                fields.forEach((field, index) => {
                    const method = index === 0 ? 'where' : 'orWhere';
                    qb[method](`LOWER(${nameTable}.${field}) LIKE :query`, { query: lowercaseQuery });
                });

                if (searchFieldsInRelations) {
                    searchFieldsInRelations.forEach(({ tableName, fields }) => {
                        fields.forEach((field) => {
                            qb.orWhere(`LOWER(${tableName}.${field}) LIKE :query`, { query: lowercaseQuery });
                        });
                    });
                }
            }),
        );
    }

    addRelationsToQueryBuilder(queryBuilder, nameTable, relations);

    const pageNew = Math.max(page, 1);
    const limitNew = limit > 0 ? limit : 10;
    queryBuilder.skip((pageNew - 1) * limitNew).take(limitNew);
    if (sort && sortField) {
        queryBuilder.orderBy(`${nameTable}.${sortField}`, sort);
    }

    return from(queryBuilder.getManyAndCount()).pipe(
        map(([data, total]) => {
            const paginatedData: PaginatedData<T> = {
                currentPage: pageNew,
                items: data,
                perPage: data.length,
                totalItems: total,
                totalPages: Math.ceil(total / limitNew),
                nextPage: pageNew * limitNew < total ? pageNew + 1 : undefined,
            };
            const apiResponse: ApiResponse<PaginatedData<T>> = {
                data: paginatedData,
                message: 'Success',
            };
            return apiResponse;
        }),
    );
}
