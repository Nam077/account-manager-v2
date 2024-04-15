import { Observable } from 'rxjs';

export interface CrudService<T, H, G, K, O, U> {
    create(currentUser: U, createDto: H): Observable<T>;
    findAll(currentUser: U, findAllDto: K): Observable<T>;
    findOne(currentUser: U, id: string): Observable<T>;
    update(currentUser: U, id: string, updateDto: G): Observable<T>;
    remove(currentUser: U, id: string, hardRemove?: boolean): Observable<T>;
    restore(currentUser: U, id: string): Observable<T>;
    findOneData(id: string): Observable<O>;
}
