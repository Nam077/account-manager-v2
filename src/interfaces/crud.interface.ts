import { Observable } from 'rxjs';

/**
 * Represents a generic CRUD service interface.
 * @template API - The API response type.
 * @template ENTITY - The entity type.
 * @template PAGINATE - The pagination type.
 * @template CREATEDTO - The create DTO type.
 * @template UPDATEDTO - The update DTO type.
 * @template FINDALLDTO - The find all DTO type.
 * @template USER - The user type.
 */
/**
 * Represents a CRUD (Create, Read, Update, Delete) service interface.
 * @template API - The API response type.
 * @template ENTITY - The entity type.
 * @template PAGINATE - The paginated result type.
 * @template CREATEDTO - The create DTO type.
 * @template UPDATEDTO - The update DTO type.
 * @template FINDALLDTO - The find all DTO type.
 * @template USER - The user type.
 */
export interface CrudService<API, ENTITY, PAGINATE, CREATEDTO, UPDATEDTO, FINDALLDTO, USER> {
    /**
     * Creates a new entity.
     * @param createDto - The create DTO.
     * @returns An observable of the created entity.
     */
    createProcess(createDto: CREATEDTO): Observable<ENTITY>;

    /**
     * Creates a new entity and returns the API response.
     * @param currentUser - The current user.
     * @param createDto - The create DTO.
     * @returns An observable of the API response.
     */
    create(currentUser: USER, createDto: CREATEDTO): Observable<API>;

    /**
     * Finds an entity by its ID.
     * @param id - The ID of the entity.
     * @returns An observable of the found entity.
     */
    findOneData(id: string): Observable<ENTITY>;

    /**
     * Finds an entity by its ID and returns the API response.
     * @param id - The ID of the entity.
     * @returns An observable of the API response.
     */
    findOneProcess(id: string): Observable<ENTITY>;

    /**
     * Finds an entity by its ID and returns the API response.
     * @param currentUser - The current user.
     * @param id - The ID of the entity.
     * @returns An observable of the API response.
     */
    findOne(currentUser: USER, id: string): Observable<API>;

    /**
     * Finds all entities based on the find all DTO.
     * @param findAllDto - The find all DTO.
     * @returns An observable of the paginated result.
     */
    findAllProcess(findAllDto: FINDALLDTO): Observable<PAGINATE>;

    /**
     * Finds all entities based on the find all DTO and returns the API response.
     * @param currentUser - The current user.
     * @param findAllDto - The find all DTO.
     * @returns An observable of the API response.
     */
    findAll(currentUser: USER, findAllDto: FINDALLDTO): Observable<API>;

    /**
     * Removes an entity by its ID.
     * @param id - The ID of the entity.
     * @param hardDelete - Optional. Specifies whether to perform a hard remove. Default is false.
     * @returns An observable of the removed entity.
     */
    removeProcess(id: string, hardRemove?: boolean): Observable<ENTITY>;

    /**
     * Removes an entity by its ID and returns the API response.
     * @param currentUser - The current user.
     * @param id - The ID of the entity.
     * @param hardRemove - Optional. Specifies whether to perform a hard remove. Default is false.
     * @returns An observable of the API response.
     */
    remove(currentUser: USER, id: string, hardRemove?: boolean): Observable<API>;

    /**
     * Restores a removed entity by its ID.
     * @param id - The ID of the entity.
     * @returns An observable of the restored entity.
     */
    restoreProcess(id: string): Observable<ENTITY>;

    /**
     * Restores a removed entity by its ID and returns the API response.
     * @param currentUser - The current user.
     * @param id - The ID of the entity.
     * @returns An observable of the API response.
     */
    restore(currentUser: USER, id: string): Observable<API>;

    /**
     * Updates an entity by its ID.
     * @param id - The ID of the entity.
     * @param updateDto - The update DTO.
     * @returns An observable of the updated entity.
     */
    updateProcess(id: string, updateDto: UPDATEDTO): Observable<ENTITY>;

    /**
     * Updates an entity by its ID and returns the API response.
     * @param currentUser - The current user.
     * @param id - The ID of the entity.
     * @param updateDto - The update DTO.
     * @returns An observable of the API response.
     */
    update(currentUser: USER, id: string, updateDto: UPDATEDTO): Observable<API>;
}
