import { HttpException, HttpStatus } from '@nestjs/common';
import { Observable, from, of, switchMap, catchError, throwError } from 'rxjs';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

export function updateEntity<T extends { id: string }>(
    repository: Repository<T>,
    entity: T,
    updateDto: DeepPartial<T>,
): Observable<T> {
    return of(repository.merge(entity, updateDto)).pipe(
        switchMap((updatedEntity) => from(repository.save(updatedEntity))),
        switchMap((updatedEntity) =>
            from(repository.findOne({ where: { id: updatedEntity.id } as FindOptionsWhere<T> })),
        ),
        catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
    );
}
export interface CheckForForkJoin {
    [key: string]: boolean;
}
