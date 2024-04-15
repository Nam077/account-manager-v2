import { HttpException, HttpStatus } from '@nestjs/common';
import { Observable, from, map, of, switchMap, catchError, throwError } from 'rxjs';
import { ApiResponse } from 'src/interfaces/api-response.interface';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

export function updateEntity<T extends { id: string }>(
    repository: Repository<T>,
    entity: T,
    updateDto: DeepPartial<T>,
): Observable<ApiResponse<T>> {
    return of(repository.merge(entity, updateDto)).pipe(
        switchMap((updatedEntity) => from(repository.save(updatedEntity))),
        switchMap((updatedEntity) =>
            from(repository.findOne({ where: { id: updatedEntity.id } as FindOptionsWhere<T> })),
        ),
        map((updatedEntity) => ({ success: true, data: updatedEntity })),
        catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
    );
}
