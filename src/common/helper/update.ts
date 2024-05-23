import { HttpException, HttpStatus } from '@nestjs/common';
import { catchError, from, Observable, of, switchMap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

export const updateEntity = <T extends { id: string }>(
    repository: Repository<T>,
    entity: T,
    updateDto: DeepPartial<T>,
): Observable<T> => {
    return of(repository.merge(entity, updateDto)).pipe(
        switchMap((updatedEntity) => from(repository.save(updatedEntity))),
        catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
    );
};

export interface CheckForForkJoin {
    [key: string]: boolean;
}
