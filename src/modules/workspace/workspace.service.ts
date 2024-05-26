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
import { catchError, forkJoin, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    CustomCondition,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
    UserAuth,
    WorkspaceEmailStatus,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AdminAccountService } from '../admin-account/admin-account.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindAllWorkspaceDto } from './dto/find-all.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';

@Injectable()
export class WorkspaceService
    implements
        CrudService<
            ApiResponse<Workspace | Workspace[] | PaginatedData<Workspace>>,
            Workspace,
            PaginatedData<Workspace>,
            CreateWorkspaceDto,
            UpdateWorkspaceDto,
            FindAllWorkspaceDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(Workspace)
        private readonly workspaceRepository: Repository<Workspace>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly adminAccountService: AdminAccountService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}

    createProcess(createDto: CreateWorkspaceDto): Observable<Workspace> {
        const { adminAccountId, description, maxSlots, type } = createDto;

        return from(this.checkExistByAdminAccountId(adminAccountId)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.Workspace.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return this.adminAccountService.findOneProcess(adminAccountId);
            }),
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AdminAccount.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const workspace = new Workspace();

                workspace.adminAccountId = adminAccountId;
                workspace.description = description;
                workspace.maxSlots = maxSlots;
                workspace.type = type;

                return from(this.workspaceRepository.save(workspace));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    create(currentUser: UserAuth, createDto: CreateWorkspaceDto): Observable<ApiResponse<Workspace>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Create, Workspace)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.createProcess(createDto).pipe(map((data) => ({ data, status: HttpStatus.CREATED })));
    }

    findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<Workspace>,
        isWithDeleted?: boolean,
    ): Observable<Workspace> {
        return from(this.workspaceRepository.findOne({ where: { id }, ...options, withDeleted: isWithDeleted }));
    }

    findOneAndGetWorkspaceEmailHaveStatus(id: string, status: WorkspaceEmailStatus): Observable<Workspace> {
        return from(
            this.workspaceRepository
                .createQueryBuilder('workspace')
                .leftJoinAndSelect('workspace.workspaceEmails', 'workspaceEmails', 'workspaceEmails.status = :status', {
                    status: status,
                })
                .where('workspace.id = :id', { id })
                .getOne(),
        );
    }

    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<Workspace>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Read, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Workspace);

        return this.findOneProcess(
            id,
            {
                relations: {
                    adminAccount: { account: true },
                },
            },
            isCanReadWithDeleted,
        ).pipe(
            map((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return {
                    data: workspace,
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Workspace.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    findAllProcess(findAllDto: FindAllWorkspaceDto, isWithDeleted?: boolean): Observable<PaginatedData<Workspace>> {
        const fields: Array<keyof Workspace> = ['id', 'description', 'maxSlots', 'adminAccountId'];
        const relations = ['adminAccount', 'adminAccount.account'];
        const searchFields: SearchField[] = [];

        return findWithPaginationAndSearch<Workspace>(
            this.workspaceRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }

    findAll(currentUser: UserAuth, findAllDto: FindAllWorkspaceDto): Observable<ApiResponse<PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.ReadAll, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Workspace);

        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((data) => ({
                data,
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Workspace.Found', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    removeProcess(id: string, hardRemove?: boolean): Observable<Workspace> {
        return this.findOneProcess(
            id,
            {
                relations: {
                    workspaceEmails: !hardRemove,
                },
            },
            hardRemove,
        ).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (hardRemove) {
                    if (!workspace.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Workspace.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    return from(this.workspaceRepository.remove(workspace));
                }

                if (workspace.workspaceEmails && workspace.workspaceEmails.length > 0) {
                    throw new BadRequestException('Workspace has workspace emails');
                }

                return from(this.workspaceRepository.softRemove(workspace));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    remove(currentUser: UserAuth, id: string, hardRemove?: boolean): Observable<ApiResponse<Workspace>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Delete, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({
                data,
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Workspace.Deleted', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    restoreProcess(id: string): Observable<Workspace> {
        return from(this.workspaceRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (!workspace.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Workspace.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return from(this.workspaceRepository.restore(workspace.id)).pipe(map(() => workspace));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    restore(
        currentUser: UserAuth,
        id: string,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Restore, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.restoreProcess(id).pipe(
            map((workspace) => ({
                data: workspace,
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Workspace.Restored', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    updateProcess(id: string, updateDto: UpdateWorkspaceDto): Observable<Workspace> {
        const updateData: DeepPartial<Workspace> = { ...updateDto };

        return from(
            this.findOneProcess(id, {
                relations: {
                    workspaceEmails: true,
                    adminAccount: {
                        account: true,
                    },
                },
            }),
        ).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const tasks: Observable<any>[] = [];

                if (updateDto.type && updateDto.type !== workspace.type) {
                    if (workspace.workspaceEmails && workspace.workspaceEmails.length > 0) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Workspace.NotUpdated', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                }

                if (updateDto.adminAccountId && updateDto.adminAccountId !== workspace.adminAccountId) {
                    tasks.push(
                        this.adminAccountService
                            .findOneProcess(updateDto.adminAccountId, {
                                relations: {
                                    account: true,
                                },
                            })
                            .pipe(
                                map((adminAccount) => {
                                    if (!adminAccount) {
                                        throw new NotFoundException(
                                            this.i18nService.translate('message.AdminAccount.NotFound', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }

                                    if (adminAccount.account.id !== workspace.adminAccount.account.id) {
                                        throw new BadRequestException(
                                            this.i18nService.translate('message.Workspace.NotUpdated', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }

                                    delete workspace.adminAccount;
                                }),
                            ),
                    );
                } else tasks.push(of(null));

                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return from(updateEntity<Workspace>(this.workspaceRepository, workspace, updateData));
                    }),
                );
            }),
        );
    }

    update(currentUser: UserAuth, id: string, updateDto: UpdateWorkspaceDto): Observable<ApiResponse<Workspace>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Update, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({
                data,
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Workspace.Updated', {
                    lang: I18nContext.current().lang,
                    args: {
                        name: id,
                    },
                }),
            })),
        );
    }

    checkExistByAdminAccountId(adminAccountId: string): Observable<boolean> {
        return from(this.workspaceRepository.existsBy({ adminAccountId }));
    }

    findAllByAccountProcess(id: string, findAllDto: FindAllWorkspaceDto): Observable<PaginatedData<Workspace>> {
        const fields: Array<keyof Workspace> = ['id', 'description', 'maxSlots', 'adminAccountId'];
        const relations = ['adminAccount', 'adminAccount.account'];
        const searchFields: SearchField[] = [];

        const additionalConditions: CustomCondition[] = [
            {
                field: 'adminAccountId',
                value: id,
                operator: 'EQUAL',
            },
        ];

        return findWithPaginationAndSearch<Workspace>(
            this.workspaceRepository,
            findAllDto,
            fields,
            false,
            relations,
            searchFields,
            additionalConditions,
        );
    }

    findAllByAccount(user: UserAuth, id: string, findAllDto: FindAllWorkspaceDto) {
        const ability = this.caslAbilityFactory.createForUser(user);

        if (ability.cannot(ActionCasl.ReadAll, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.findAllByAccountProcess(id, findAllDto).pipe(
            map((data) => ({
                data,
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Workspace.Found', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }
}
