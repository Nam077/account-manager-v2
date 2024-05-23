import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { FindAllDtoAbstract } from '../dto';

/**
 * Parameters for finding data with pagination and search.
 */

/**
 * Represents the paginated data.
 */

interface FindAllDtoWithSearchFields extends FindAllDtoAbstract {
    sortField?: string;
}
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
 * Custom condition for additional where clauses.
 */
export interface CustomCondition {
    field: string;
    value: any;
    operator?: 'EQUAL' | 'LIKE' | 'LT' | 'GT'; // Add more operators as needed
}

/**
 * Applies multiple additional `where` conditions to the query builder.
 * @param queryBuilder - The query builder to modify.
 * @param conditions - The conditions for the query.
 */
const applyAdditionalConditions = <T>(queryBuilder: SelectQueryBuilder<T>, conditions: CustomCondition[]): void => {
    conditions.forEach(({ field, value, operator = 'EQUAL' }, index) => {
        const paramName = `${field}${index}`;
        const conditionString = `${queryBuilder.alias}.${field}`;

        switch (operator) {
            case 'LIKE':
                queryBuilder.andWhere(`${conditionString} LIKE :${paramName}`, { [paramName]: `%${value}%` });
                break;
            case 'LT':
                queryBuilder.andWhere(`${conditionString} < :${paramName}`, { [paramName]: value });
                break;
            case 'GT':
                queryBuilder.andWhere(`${conditionString} > :${paramName}`, { [paramName]: value });
                break;
            default:
                queryBuilder.andWhere(`${conditionString} = :${paramName}`, { [paramName]: value });
                break;
        }
    });
};

/**
 * Adds relations to the query builder.
 * @param queryBuilder - The query builder to modify.
 * @param tableName - The name of the table.
 * @param relations - The relations to add.
 */
const addRelationsToQueryBuilder = <T>(
    queryBuilder: SelectQueryBuilder<T>,
    tableName: string,
    relations?: string[],
): void => {
    if (relations) {
        relations = relations.filter((relation) => {
            if (relation !== '' && relation !== null) {
                return relation;
            }
        });
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
};

const validateRelations = (searchFieldsInRelations: SearchField[], relations?: string[]): boolean => {
    if (searchFieldsInRelations.length > 0) {
        const requiredRelations = searchFieldsInRelations.map((sf) => sf.tableName);

        return requiredRelations.every((rr) => relations?.includes(rr));
    }

    return true;
};

/**
 * Finds data with pagination and search.
 * @param repository - The repository to query.
 * @param findAllDto - The parameters for finding data.
 * @param fields - The fields to search in.
 * @param searchFieldsInRelations - The fields to search in relations.
 * @param relations
 * @returns An observable of ApiResponse containing the paginated data.
 */
export const findWithPaginationAndSearch = <T>(
    repository: Repository<T>,
    findAllDto: FindAllDtoWithSearchFields,
    fields: Array<keyof T>,
    isWithDeleted = false,
    relations: string[],
    searchFieldsInRelations: SearchField[] = [],
    additionalConditions: CustomCondition[] = [],
): Observable<PaginatedData<T>> => {
    if (!validateRelations(searchFieldsInRelations, relations)) {
        throw new HttpException(
            'Missing required relations for the specified search fields in relations.',
            HttpStatus.BAD_REQUEST,
        );
    }

    const nameTable = repository.metadata.tableName;
    const { query, page = 1, limit, sort, sortField, withDeleted } = findAllDto;

    const queryBuilder = repository.createQueryBuilder(nameTable);

    // Áp dụng các điều kiện bổ sung nếu có
    if (additionalConditions.length > 0) {
        applyAdditionalConditions(queryBuilder, additionalConditions);
    }

    // Áp dụng điều kiện tìm kiếm nếu có
    if (query) {
        const lowercaseQuery = `%${query.toLowerCase()}%`;

        queryBuilder.andWhere(
            new Brackets((qb) => {
                fields.forEach((field, index) => {
                    const method = index === 0 ? 'where' : 'orWhere';

                    qb[method](`LOWER(${nameTable}.${field as string}) LIKE :query`, {
                        query: lowercaseQuery,
                    });
                });

                if (searchFieldsInRelations) {
                    searchFieldsInRelations.forEach(({ tableName, fields }) => {
                        fields.forEach((field) => {
                            qb.orWhere(`LOWER(${tableName}.${field}) LIKE :query`, {
                                query: lowercaseQuery,
                            });
                        });
                    });
                }
            }),
        );
    }

    addRelationsToQueryBuilder(queryBuilder, nameTable, relations);
    const pageNew = Math.max(page, 1);
    let limitNew = limit > 0 ? limit : 10;

    if (limitNew > 100) {
        limitNew = 100;
    }

    queryBuilder.skip((pageNew - 1) * limitNew).take(limitNew);

    if (sort && sortField) {
        queryBuilder.orderBy(`${nameTable}.${sortField}`, sort);
    }

    if ((isWithDeleted && withDeleted === 'TRUE') || (isWithDeleted && !withDeleted)) {
        queryBuilder.withDeleted();
    }

    return from(queryBuilder.getManyAndCount()).pipe(
        map(([data, total]) => {
            return {
                currentPage: pageNew,
                items: data,
                perPage: data.length,
                totalItems: total,
                totalPages: Math.ceil(total / limitNew),
                nextPage: pageNew * limitNew < total ? pageNew + 1 : undefined,
            };
        }),
        catchError((error) => throwError(() => new BadRequestException(error.message))),
    );
};
