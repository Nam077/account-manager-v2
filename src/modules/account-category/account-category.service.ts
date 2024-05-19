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
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ApiResponse,
    CrudService,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    slugifyString,
    updateEntity,
    UserAuth,
} from '../../common';
import { ActionCasl } from '../../common/enum/action-casl.enum';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateAccountCategoryDto } from './dto/create-account-category.dto';
import { FindAllAccountCategoryDto } from './dto/find-all.dto';
import { UpdateAccountCategoryDto } from './dto/update-account-category.dto';
import { AccountCategory } from './entities/account-category.entity';

@Injectable()
export class AccountCategoryService
    implements
        CrudService<
            ApiResponse<AccountCategory | AccountCategory[] | PaginatedData<AccountCategory>>,
            AccountCategory,
            PaginatedData<AccountCategory>,
            CreateAccountCategoryDto,
            UpdateAccountCategoryDto,
            FindAllAccountCategoryDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(AccountCategory)
        private readonly accountCategoryRepository: Repository<AccountCategory>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateAccountCategoryDto): Observable<AccountCategory> {
        const { name, description } = createDto;
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.AccountCategory.Conflict', {
                            args: { name },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const accountCategory = new AccountCategory();
                accountCategory.name = name;
                accountCategory.description = description;
                accountCategory.slug = slug;
                return from(this.accountCategoryRepository.save(accountCategory));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: UserAuth, createDto: CreateAccountCategoryDto): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, AccountCategory)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.CREATED,
                    message: this.i18nService.translate('message.AccountCategory.Created', {
                        args: { name: data.name },
                        lang: I18nContext.current().lang,
                    }),
                    data,
                }),
            ),
        );
    }
    findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<AccountCategory>,
        isWithDeleted?: boolean,
    ): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { id }, ...options, withDeleted: isWithDeleted }));
    }
    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, AccountCategory)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, AccountCategory);
        return this.findOneProcess(id, {}, isCanReadWithDeleted).pipe(
            map((accountCategory): ApiResponse<AccountCategory> => {
                if (!accountCategory) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountCategory.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    data: accountCategory,
                    message: this.i18nService.translate('message.AccountCategory.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(
        findAllDto: FindAllAccountCategoryDto,
        isWithDeleted?: boolean,
    ): Observable<PaginatedData<AccountCategory>> {
        const fields: Array<keyof AccountCategory> = ['id', 'name', 'description', 'slug'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];

        return findWithPaginationAndSearch<AccountCategory>(
            this.accountCategoryRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }
    findAll(
        currentUser: UserAuth,
        findAllDto: FindAllAccountCategoryDto,
    ): Observable<ApiResponse<PaginatedData<AccountCategory>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, AccountCategory)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, AccountCategory);
        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: this.i18nService.translate('message.AccountCategory.Found', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<AccountCategory> {
        return from(
            this.accountCategoryRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: { accounts: !hardRemove },
            }),
        ).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountCategory.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!accountCategory.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.AccountCategory.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.accountCategoryRepository.remove(accountCategory));
                }

                if (accountCategory.accounts && accountCategory.accounts.length > 0) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.AccountCategory.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.accountCategoryRepository.softRemove(accountCategory));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(currentUser: UserAuth, id: string, hardRemove?: boolean): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to delete account category');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                    message: this.i18nService.translate('message.AccountCategory.Deleted', {
                        lang: I18nContext.current().lang,
                        args: { name: data.name },
                    }),
                }),
            ),
        );
    }
    restoreProcess(id: string): Observable<AccountCategory> {
        return from(
            this.accountCategoryRepository.findOne({
                where: { id },
                withDeleted: true,
            }),
        ).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountCategory.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!accountCategory.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.AccountCategory.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.accountCategoryRepository.restore(accountCategory.id)).pipe(
                    map(() => accountCategory),
                );
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Restore, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to restore account category');
        }
        return this.restoreProcess(id).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                    message: this.i18nService.translate('message.AccountCategory.Restored', {
                        lang: I18nContext.current().lang,
                        args: { name: data.name },
                    }),
                }),
            ),
        );
    }
    updateProcess(id: string, updateDto: UpdateAccountCategoryDto): Observable<AccountCategory> {
        const updateData: DeepPartial<AccountCategory> = { ...updateDto };
        return from(this.findOneProcess(id)).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountCategory.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (updateData.name && accountCategory.name !== updateData.name) {
                    const slug = slugifyString(updateData.name);
                    return from(this.checkExistBySlug(slug)).pipe(
                        switchMap((isExist) => {
                            if (isExist) {
                                throw new ConflictException(
                                    this.i18nService.translate('message.AccountCategory.Conflict', {
                                        args: { name: updateData.name },
                                        lang: I18nContext.current().lang,
                                    }),
                                );
                            }
                            updateData.slug = slug;
                            return of(accountCategory);
                        }),
                    );
                }
                return of(accountCategory);
            }),
            switchMap((accountCategory) => {
                return updateEntity<AccountCategory>(this.accountCategoryRepository, accountCategory, updateData);
            }),
        );
    }
    update(
        currentUser: UserAuth,
        id: string,
        updateDto: UpdateAccountCategoryDto,
    ): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Update, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to update account category');
        }
        return this.updateProcess(id, updateDto).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                    message: this.i18nService.translate('message.AccountCategory.Updated', {
                        lang: I18nContext.current().lang,
                        args: { name: data.name },
                    }),
                }),
            ),
        );
    }
    findOneBySlug(slug: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { slug } }));
    }
    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountCategoryRepository.existsBy({ slug }));
    }
    findAllAccountCategory(user: UserAuth) {
        const ability = this.caslAbilityFactory.createForUser(user);
        if (!ability.can(ActionCasl.ReadAll, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to read account category');
        }
        return this.findAllAccountCategoryProcess();
    }

    findAllAccountCategoryProcess() {
        return from(this.accountCategoryRepository.find());
    }
}
