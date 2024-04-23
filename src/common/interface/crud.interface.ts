import { Observable } from 'rxjs';

/**
 * Represents a CRUD (Create, Read, Update, Delete) service interface.
 * @template API - The API response type.
 * @template ENTITY - The entity type.
 * @template PAGINATE - The paginated result type.
 * @template CREATE_DTO - The create DTO type.
 * @template UPDATE_DTO - The update DTO type.
 * @template FIND_ALL_DTO - The find all DTO type.
 * @template USER - The user type.
 */
export interface CrudService<API, ENTITY, PAGINATE, CREATE_DTO, UPDATE_DTO, FIND_ALL_DTO, USER> {
    /**
     * Creates a new entity.
     * @param createDto - The create DTO.
     * @returns An observable of the created entity.
     */
    createProcess(createDto: CREATE_DTO): Observable<ENTITY>;

    /**
     * Creates a new entity and returns the API response.
     * @param currentUser - The current user.
     * @param createDto - The create DTO.
     * @returns An observable of the API response.
     */
    create(currentUser: USER, createDto: CREATE_DTO): Observable<API>;

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
    findAllProcess(findAllDto: FIND_ALL_DTO): Observable<PAGINATE>;

    /**
     * Finds all entities based on the find all DTO and returns the API response.
     * @param currentUser - The current user.
     * @param findAllDto - The find all DTO.
     * @returns An observable of the API response.
     */
    findAll(currentUser: USER, findAllDto: FIND_ALL_DTO): Observable<API>;

    /**
     * Removes an entity by its ID.
     * @param id - The ID of the entity.
     * @param hardRemove - Optional. Specifies whether to perform a hard remove. Default is false.
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
    updateProcess(id: string, updateDto: UPDATE_DTO): Observable<ENTITY>;

    /**
     * Updates an entity by its ID and returns the API response.
     * @param currentUser - The current user.
     * @param id - The ID of the entity.
     * @param updateDto - The update DTO.
     * @returns An observable of the API response.
     */
    update(currentUser: USER, id: string, updateDto: UPDATE_DTO): Observable<API>;
}
