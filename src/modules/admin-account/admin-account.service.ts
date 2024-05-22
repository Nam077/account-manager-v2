import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { I18nContext } from 'nestjs-i18n';
import { catchError, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
    UserAuth,
} from '../../common';
import { FindOneOptionsCustom } from '../../common/interface/find-one.interface';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountService } from '../account/account.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { FindAllAdminAccountDto } from './dto/find-all.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { AdminAccount } from './entities/admin-account.entity';
@Injectable()
export class AdminAccountService
    implements
        CrudService<
            ApiResponse<AdminAccount | AdminAccount[] | PaginatedData<AdminAccount>>,
            AdminAccount,
            PaginatedData<AdminAccount>,
            CreateAdminAccountDto,
            UpdateAdminAccountDto,
            FindAllAdminAccountDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(AdminAccount)
        private readonly adminAccountRepository: Repository<AdminAccount>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountService: AccountService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateAdminAccountDto): Observable<AdminAccount> {
        const { email, accountId, value } = createDto;

        return from(this.findByEmailAndAccountId(email, accountId)).pipe(
            switchMap((adminAccount) => {
                if (adminAccount) {
                    throw new ConflictException(
                        this.i18nService.translate('message.AdminAccount.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.accountService.findOneProcess(accountId).pipe(
                    switchMap((account) => {
                        if (!account) {
                            throw new NotFoundException(
                                this.i18nService.translate('message.Account.NotFound', {
                                    lang: I18nContext.current().lang,
                                }),
                            );
                        }
                        const newAdminAccount = new AdminAccount();
                        newAdminAccount.email = email;
                        newAdminAccount.accountId = accountId;
                        newAdminAccount.value = value;
                        return from(this.adminAccountRepository.save(newAdminAccount));
                    }),
                    catchError((error) => throwError(() => new BadRequestException(error.message))),
                );
            }),
        );
    }
    create(currentUser: UserAuth, createDto: CreateAdminAccountDto): Observable<ApiResponse<AdminAccount>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Create, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.createProcess(createDto).pipe(
            map((data) => ({
                status: HttpStatus.CREATED,
                message: this.i18nService.translate('message.AdminAccount.Created', {
                    lang: I18nContext.current().lang,
                }),
                data,
            })),
        );
    }

    findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<AdminAccount>,
        isWithDeleted?: boolean,
    ): Observable<AdminAccount> {
        return from(
            this.adminAccountRepository.findOne({
                where: { id },
                ...options,
                withDeleted: isWithDeleted,
            }),
        );
    }
    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<AdminAccount>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, AdminAccount);
        return this.findOneProcess(
            id,
            {
                relations: {
                    account: true,
                },
            },
            isCanReadWithDeleted,
        ).pipe(
            map((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AdminAccount.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    data: adminAccount,
                    message: this.i18nService.translate('message.AdminAccount.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(
        findAllDto: FindAllAdminAccountDto,
        isWithDeleted?: boolean,
    ): Observable<PaginatedData<AdminAccount>> {
        const fields: Array<keyof AdminAccount> = ['id', 'email', 'value'];
        const relations = ['account'];
        const searchFields: SearchField[] = [
            {
                tableName: 'account',
                fields: ['name', 'description'],
            },
        ];
        return findWithPaginationAndSearch<AdminAccount>(
            this.adminAccountRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }
    findAll(
        currentUser: UserAuth,
        findAllDto: FindAllAdminAccountDto,
    ): Observable<ApiResponse<PaginatedData<AdminAccount>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadAllWithDeleted = ability.can(ActionCasl.ReadWithDeleted, AdminAccount);
        return this.findAllProcess(findAllDto, isCanReadAllWithDeleted).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: this.i18nService.translate('message.AdminAccount.Found', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<AdminAccount> {
        return from(
            this.adminAccountRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: { workspaces: !hardRemove },
            }),
        ).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AdminAccount.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (hardRemove) {
                    if (!adminAccount.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.AdminAccount.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.adminAccountRepository.remove(adminAccount));
                }
                if (adminAccount.workspaces) {
                    if (adminAccount.workspaces.length > 0) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.AdminAccount.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                }

                return from(this.adminAccountRepository.softRemove(adminAccount));
            }),
        );
    }
    remove(
        currentUser: UserAuth,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: this.i18nService.translate('message.AdminAccount.Deleted', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }
    restoreProcess(id: string): Observable<AdminAccount> {
        return this.findOneProcess(id, {}, true).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AdminAccount.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!adminAccount.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.AdminAccount.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.adminAccountRepository.restore(adminAccount.id)).pipe(map(() => adminAccount));
            }),
        );
    }
    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<AdminAccount>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Restore, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.restoreProcess(id).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: this.i18nService.translate('message.AdminAccount.Restored', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }
    updateProcess(id: string, updateDto: UpdateAdminAccountDto): Observable<AdminAccount> {
        const updateData: DeepPartial<AdminAccount> = { ...updateDto };
        return from(this.findOneProcess(id)).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AdminAccount.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const checkEmail = updateDto.email || adminAccount.email;
                const checkAccountId = updateDto.accountId || adminAccount.accountId;
                const tasks: Observable<any>[] = [];
                if (updateDto.accountId && updateDto.accountId !== adminAccount.accountId) {
                    tasks.push(
                        this.accountService.findOneProcess(updateDto.accountId).pipe(
                            tap((account) => {
                                if (!account) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.Account.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                delete updateData.account;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (
                    (updateDto.accountId && updateDto.accountId !== adminAccount.accountId) ||
                    (updateDto.email && updateDto.email !== adminAccount.email)
                ) {
                    tasks.push(
                        this.checkExistByEmailAndAccountId(checkEmail, checkAccountId).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.AdminAccount.Conflict', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                return from(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<AdminAccount>(this.adminAccountRepository, adminAccount, updateData);
                    }),
                );
            }),
        );
    }
    update(
        currentUser: UserAuth,
        id: string,
        updateDto: UpdateAdminAccountDto,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Update, AdminAccount)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: this.i18nService.translate('message.AdminAccount.Updated', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    findByEmailAndAccountId(email: string, accountId: string): Observable<AdminAccount> {
        return from(
            this.adminAccountRepository.findOne({
                where: { email, accountId },
            }),
        );
    }

    checkExistByEmailAndAccountId(email: string, accountId: string): Observable<boolean> {
        return from(
            this.adminAccountRepository.existsBy({
                email,
                accountId,
            }),
        );
    }
}
