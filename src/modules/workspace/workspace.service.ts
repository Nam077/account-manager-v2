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
    updateEntity,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AdminAccountService } from '../admin-account/admin-account.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { User } from '../user/entities/user.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
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
            FindAllDto,
            User
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
        const { adminAccountId, description, maxSlots } = createDto;
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
                return from(this.workspaceRepository.save(workspace));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateWorkspaceDto): Observable<ApiResponse<Workspace>> {
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

    findOneProcess(id: string, options?: FindOneOptionsCustom<Workspace>): Observable<Workspace> {
        return from(this.workspaceRepository.findOne({ where: { id }, ...options }));
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findOneProcess(id).pipe(
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
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Workspace>> {
        const fields: Array<keyof Workspace> = ['id', 'description', 'maxSlots', 'adminAccountId'];
        const relations = ['adminAccount'];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<Workspace>(
            this.workspaceRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.ReadAll, Workspace)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
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
        return from(
            this.workspaceRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: { workspaceEmails: !hardRemove },
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
                if (workspace.workspaceEmails) {
                    throw new BadRequestException('Workspace has workspace emails');
                }
                return from(this.workspaceRepository.softRemove(workspace));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
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
        currentUser: User,
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
        return from(this.findOneProcess(id)).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.adminAccountId && updateDto.adminAccountId !== workspace.adminAccountId) {
                    tasks.push(
                        this.adminAccountService.findOneProcess(updateDto.adminAccountId).pipe(
                            tap((adminAccount) => {
                                if (!adminAccount) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.AdminAccount.NotFound', {
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
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateWorkspaceDto,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
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
                }),
            })),
        );
    }

    checkExistByAdminAccountId(adminAccountId: string): Observable<boolean> {
        return from(this.workspaceRepository.existsBy({ adminAccountId }));
    }
}
