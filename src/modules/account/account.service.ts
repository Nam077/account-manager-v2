import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    FindAllDto,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    slugifyString,
    updateEntity,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountCategoryService } from '../account-category/account-category.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { User } from '../user/entities/user.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountService
    implements
        CrudService<
            ApiResponse<Account | Account[] | PaginatedData<Account>>,
            Account,
            PaginatedData<Account>,
            CreateAccountDto,
            UpdateAccountDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountCategoryService: AccountCategoryService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}

    /**
     * Creates a new account based on the provided data.
     * @author Nam077
     * @param {CreateAccountDto} createDto - The data required to create an account.
     * @return {Observable<Account>} An observable that emits the created account.
     * @throws {ConflictException} If the account already exists.
     * @throws {NotFoundException} If the account category does not exist.
     * @throws {BadRequestException} If there is an error while creating the account.
     */
    createProcess(createDto: CreateAccountDto): Observable<Account> {
        const { name, description, accountCategoryId } = createDto;
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.Account.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.accountCategoryService.findOneProcess(accountCategoryId).pipe(
                    switchMap((accountCategory) => {
                        if (!accountCategory) {
                            throw new NotFoundException(
                                this.i18nService.translate('message.AccountCategory.NotFound', {
                                    lang: I18nContext.current().lang,
                                }),
                            );
                        }
                        const account = new Account();
                        account.name = name;
                        account.description = description;
                        account.accountCategory = accountCategory;
                        account.slug = slug;
                        return from(this.accountRepository.save(account));
                    }),
                    catchError((error) => throwError(() => new BadRequestException(error.message))),
                );
            }),
        );
    }
    /**
     * Creates a new account based on the provided data.
     * @author Nam077
     * @param currentUser The user who is creating the account
     * @param createDto The data required to create an account
     * @return An observable that emits the created account
     * @throws {ForbiddenException} If the user is not allowed to create an account
     */
    create(
        currentUser: User,
        createDto: CreateAccountDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, Account)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map((data) => ({
                status: HttpStatus.CREATED,
                message: this.i18nService.translate('message.Account.Created', {
                    lang: I18nContext.current().lang,
                    args: { name: data.name },
                }),
                data,
            })),
        );
    }

    findOneProcess(id: string, options?: FindOneOptionsCustom<Account>): Observable<Account> {
        return from(
            this.accountRepository.findOne({
                where: { id },
                ...options,
            }),
        );
    }

    /**
     * Finds an account by its ID. If the user is not allowed to read the account, a ForbiddenException is thrown.
     * @author Nam077
     * @param currentUser - The user who is trying to read the account
     * @param id - The ID of the account to find
     * @returns An Observable that emits the found account
     * @throws {ForbiddenException} If the user is not allowed to read the account
     */
    findOne(currentUser: User, id: string): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to read account');
        }
        return this.findOneProcess(id).pipe(
            map((account) => {
                if (!account) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Account.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Account.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data: account,
                };
            }),
        );
    }
    /**
     * Retrieves all accounts based on the provided data.
     * @author Nam077
     * @param {FindAllDto} findAllDto - The data required to retrieve all accounts.
     * @return {Observable<PaginatedData<Account>} An observable that emits the paginated data of accounts.
     */

    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Account>> {
        const fields: Array<keyof Account> = ['id', 'name', 'description', 'slug'];
        const relations = ['accountCategory'];
        const searchRelation: SearchField[] = [
            {
                tableName: 'accountCategory',
                fields: ['name', 'description'],
            },
        ];
        return findWithPaginationAndSearch<Account>(
            this.accountRepository,
            findAllDto,
            fields,
            searchRelation,
            relations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, Account)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
            map((data) => ({
                message: this.i18nService.translate('message.Account.Found', {
                    lang: I18nContext.current().lang,
                }),
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<Account> {
        return from(
            this.accountRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    adminAccounts: !hardRemove,
                },
            }),
        ).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Account.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!account.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Account.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.accountRepository.remove(account));
                }
                if (account.adminAccounts) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Account.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.accountRepository.softRemove(account));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, Account)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({
                message: this.i18nService.translate('message.Account.Deleted', {
                    lang: I18nContext.current().lang,
                    args: { name: data.name },
                }),
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    restoreProcess(id: string): Observable<Account> {
        return from(this.accountRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Account.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!account.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Account.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.accountRepository.restore(account.id)).pipe(map(() => account));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, Account)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map((data) => ({
                message: this.i18nService.translate('message.Account.Restored', {
                    lang: I18nContext.current().lang,
                    args: { name: data.name },
                }),
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    updateProcess(id: string, updateDto: UpdateAccountDto): Observable<Account> {
        const updateData: DeepPartial<Account> = { ...updateDto };
        return from(this.findOneProcess(id)).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Account.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.name && updateDto.name !== account.name) {
                    const slug = slugifyString(updateDto.name);
                    tasks.push(
                        from(this.checkExistBySlug(slug)).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.Account.Conflict', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                updateData.slug = slug;
                            }),
                        ),
                    );
                } else {
                    tasks.push(of(null));
                }
                if (updateDto.accountCategoryId && updateDto.accountCategoryId !== account.accountCategory.id) {
                    tasks.push(
                        this.accountCategoryService.findOneProcess(updateDto.accountCategoryId).pipe(
                            tap((accountCategory) => {
                                if (!accountCategory) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.AccountCategory.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                updateData.accountCategory = accountCategory;
                            }),
                        ),
                    );
                } else {
                    tasks.push(of(null));
                }
                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<Account>(this.accountRepository, account, updateData);
                    }),
                );
            }),
        );
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateAccountDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to update account');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({
                message: this.i18nService.translate('message.Account.Updated', {
                    lang: I18nContext.current().lang,
                    args: { name: data.name },
                }),
                data,
                status: HttpStatus.OK,
            })),
        );
    }

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountRepository.existsBy({ slug }));
    }

    async findOneBySlug(slug: string): Promise<Account> {
        return this.accountRepository.findOne({ where: { slug } });
    }
}
