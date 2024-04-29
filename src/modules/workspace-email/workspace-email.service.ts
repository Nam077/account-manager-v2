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
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
    WorkspaceEmailStatus,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { EmailService } from '../email/email.service';
import { User } from '../user/entities/user.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { CreateWorkspaceEmailDto } from './dto/create-workspace-email.dto';
import { FindAllWorkspaceEmailDto } from './dto/find-all.dto';
import { UpdateWorkspaceEmailDto } from './dto/update-workspace-email.dto';
import { WorkspaceEmail } from './entities/workspace-email.entity';

@Injectable()
export class WorkspaceEmailService
    implements
        CrudService<
            ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>,
            WorkspaceEmail,
            PaginatedData<WorkspaceEmail>,
            CreateWorkspaceEmailDto,
            UpdateWorkspaceEmailDto,
            FindAllWorkspaceEmailDto,
            User
        >
{
    constructor(
        @InjectRepository(WorkspaceEmail)
        private readonly workspaceEmailRepository: Repository<WorkspaceEmail>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly workspaceService: WorkspaceService,
        private readonly emailService: EmailService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateWorkspaceEmailDto): Observable<WorkspaceEmail> {
        const { emailId, workspaceId } = createDto;
        return from(
            this.workspaceService.findOneProcess(workspaceId, {
                relations: { workspaceEmails: true },
            }),
        ).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (workspace.workspaceEmails && workspace.workspaceEmails.length === workspace.maxSlots) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Workspace.Full', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.emailService.findOneProcess(emailId));
            }),
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.checkExistByWorkspaceIdAndEmailId(workspaceId, emailId));
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.WorkspaceEmail.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const workspaceEmail = new WorkspaceEmail();
                workspaceEmail.emailId = emailId;
                workspaceEmail.workspaceId = workspaceId;
                return from(this.workspaceEmailRepository.save(workspaceEmail));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    createProcessAndGetId(createDto: CreateWorkspaceEmailDto): Observable<string> {
        return this.createProcess(createDto).pipe(map((workspaceEmail) => workspaceEmail.id));
    }
    create(currentUser: User, createDto: CreateWorkspaceEmailDto): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Create, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.CREATED,
                    data: workspaceEmail,
                };
            }),
        );
    }

    findOneProcess(id: string, options?: FindOneOptionsCustom<WorkspaceEmail>): Observable<WorkspaceEmail> {
        return from(
            this.workspaceEmailRepository.findOne({
                where: { id },
                ...options,
            }),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findOneProcess(id, {
            relations: {
                email: true,
                workspace: true,
            },
        }).pipe(
            map((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: this.i18nService.translate('message.WorkspaceEmail.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllWorkspaceEmailDto): Observable<PaginatedData<WorkspaceEmail>> {
        const fields: Array<keyof WorkspaceEmail> = ['id', 'workspaceId', 'emailId'];
        const relations = ['workspace', 'email'];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<WorkspaceEmail>(
            this.workspaceEmailRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllWorkspaceEmailDto,
    ): Observable<ApiResponse<PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.ReadAll, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
            map((workspaceEmails) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmails,
                    message: this.i18nService.translate('message.WorkspaceEmail.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<WorkspaceEmail> {
        return from(
            this.workspaceEmailRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    rentals: true,
                },
            }),
        ).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!workspaceEmail.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.WorkspaceEmail.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.workspaceEmailRepository.remove(workspaceEmail));
                }
                if (workspaceEmail.rentals) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.WorkspaceEmail.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return from(this.workspaceEmailRepository.softRemove(workspaceEmail));
            }),
        );
    }

    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Delete, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: this.i18nService.translate('message.WorkspaceEmail.Deleted', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    restoreProcess(id: string): Observable<WorkspaceEmail> {
        return from(
            this.workspaceEmailRepository.findOne({
                where: { id },
                withDeleted: true,
            }),
        ).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!workspaceEmail.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.WorkspaceEmail.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.workspaceEmailRepository.restore(id)).pipe(map(() => workspaceEmail));
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Restore, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: this.i18nService.translate('message.WorkspaceEmail.Restored', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateWorkspaceEmailDto): Observable<WorkspaceEmail> {
        const updateData: DeepPartial<WorkspaceEmail> = updateDto;
        return from(this.workspaceEmailRepository.findOne({ where: { id } })).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.emailId && updateDto.emailId !== workspaceEmail.emailId) {
                    tasks.push(
                        this.emailService.findOneProcess(updateDto.emailId).pipe(
                            tap((email) => {
                                if (!email) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.Email.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                return email;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (updateDto.workspaceId && updateDto.workspaceId !== workspaceEmail.workspaceId) {
                    tasks.push(
                        this.workspaceService
                            .findOneProcess(updateDto.workspaceId, {
                                relations: { workspaceEmails: true },
                            })
                            .pipe(
                                tap((workspace) => {
                                    if (!workspace) {
                                        throw new NotFoundException(
                                            this.i18nService.translate('message.Workspace.NotFound', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }
                                    if (
                                        workspace.workspaceEmails &&
                                        workspace.workspaceEmails.length === workspace.maxSlots
                                    ) {
                                        throw new BadRequestException(
                                            this.i18nService.translate('message.Workspace.Full', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }
                                }),
                            ),
                    );
                } else tasks.push(of(null));
                if (
                    (updateDto.emailId && updateDto.emailId !== workspaceEmail.emailId) ||
                    (updateDto.workspaceId && updateDto.workspaceId !== workspaceEmail.workspaceId)
                ) {
                    const checkEmailId = updateDto.emailId || workspaceEmail.emailId;
                    const checkWorkspaceId = updateDto.workspaceId || workspaceEmail.workspaceId;
                    tasks.push(
                        this.checkExistByWorkspaceIdAndEmailId(checkWorkspaceId, checkEmailId).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.WorkspaceEmail.Conflict', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<WorkspaceEmail>(this.workspaceEmailRepository, workspaceEmail, updateData);
                    }),
                );
            }),
        );
    }
    updateStatusProcess(id: string, status: WorkspaceEmailStatus): Observable<WorkspaceEmail> {
        return from(this.workspaceEmailRepository.findOne({ where: { id } })).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.WorkspaceEmail.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                workspaceEmail.status = status;
                return from(this.workspaceEmailRepository.save(workspaceEmail));
            }),
        );
    }
    update(currentUser: User, id: string, updateDto: UpdateWorkspaceEmailDto): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Update, WorkspaceEmail)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.updateProcess(id, updateDto).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: this.i18nService.translate('message.WorkspaceEmail.Updated', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    checkExistByWorkspaceIdAndEmailId(workspaceId: string, emailId: string): Observable<boolean> {
        return from(this.workspaceEmailRepository.existsBy({ workspaceId, emailId }));
    }

    saveAll(workspaceEmails: WorkspaceEmail[]): Observable<WorkspaceEmail[]> {
        return from(this.workspaceEmailRepository.save(workspaceEmails));
    }
}
