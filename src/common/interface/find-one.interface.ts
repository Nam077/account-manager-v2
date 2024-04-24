import { FindOneOptions } from 'typeorm';

/**
 * Custom options for finding a single entity, extending the base FindOneOptions but
 * excluding the 'where' clause. This interface is used when the conditions are implicitly
 * defined elsewhere, or not needed.
 *
 * @template ENTITY The type of the entity being queried.
 */
export interface FindOneOptionsCustom<ENTITY> extends Omit<FindOneOptions<ENTITY>, 'where'> {}
