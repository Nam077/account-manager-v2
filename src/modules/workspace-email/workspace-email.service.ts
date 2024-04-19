import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceEmailDto } from './dto/create-workspace-email.dto';
import { UpdateWorkspaceEmailDto } from './dto/update-workspace-email.dto';
import { WorkspaceEmail } from './entities/workspace-email.entity';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, catchError, forkJoin, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { WorkspaceService } from '../workspace/workspace.service';
import { EmailService } from '../email/email.service';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class WorkspaceEmailService
    implements
        CrudService<
            ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>,
            WorkspaceEmail,
            PaginatedData<WorkspaceEmail>,
            CreateWorkspaceEmailDto,
            UpdateWorkspaceEmailDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(WorkspaceEmail) private readonly workspaceEmailRepository: Repository<WorkspaceEmail>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly workspaceService: WorkspaceService,
        private readonly emailService: EmailService,
    ) {}
    createProcess(createDto: CreateWorkspaceEmailDto): Observable<WorkspaceEmail> {
        const { emailId, workspaceId } = createDto;
        return from(this.workspaceService.findOneData(workspaceId)).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                return from(this.emailService.findOneData(emailId));
            }),
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException('Email not found');
                }
                return from(this.checkExistByWorkspaceIdAndEmailId(workspaceId, emailId));
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Workspace email already exist');
                }
                const workspaceEmail = new WorkspaceEmail();
                workspaceEmail.emailId = emailId;
                workspaceEmail.workspaceId = workspaceId;
                return from(this.workspaceEmailRepository.save(workspaceEmail));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateWorkspaceEmailDto): Observable<ApiResponse<WorkspaceEmail>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Create, WorkspaceEmail)) {
            throw new BadRequestException(HttpStatus.FORBIDDEN, 'Forbidden');
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
    findOneData(id: string): Observable<WorkspaceEmail> {
        return from(this.workspaceEmailRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<WorkspaceEmail> {
        return from(
            this.workspaceEmailRepository.findOne({
                where: { id },
                relations: {
                    email: true,
                    workspace: true,
                },
            }),
        ).pipe(
            map((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException('Workspace email not found');
                }
                return workspaceEmail;
            }),
        );
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Read, WorkspaceEmail)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.findOneProcess(id).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: 'Workspace email found',
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<WorkspaceEmail>> {
        const fields: Array<keyof WorkspaceEmail> = ['id', 'workspaceId', 'emailId'];
        const realations = ['workspace', 'email'];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<WorkspaceEmail>(
            this.workspaceEmailRepository,
            findAllDto,
            fields,
            searchFields,
            realations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.ReadAll, WorkspaceEmail)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((workspaceEmails) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmails,
                    message: 'Workspace emails found',
                };
            }),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<WorkspaceEmail> {
        return from(
            this.workspaceEmailRepository.findOne({ where: { id }, withDeleted: hardRemove, relations: {} }),
        ).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException('Workspace email not found');
                }
                if (hardRemove) {
                    if (!workspaceEmail.deletedAt) {
                        throw new BadRequestException('Workspace email already deleted');
                    }
                    return from(this.workspaceEmailRepository.remove(workspaceEmail));
                }
                return from(this.workspaceEmailRepository.softRemove(workspaceEmail));
            }),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Delete, WorkspaceEmail)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: 'Workspace email deleted',
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
                    throw new NotFoundException('Workspace email not found');
                }
                if (!workspaceEmail.deletedAt) {
                    throw new BadRequestException('Workspace email already restored');
                }
                return from(this.workspaceEmailRepository.restore(workspaceEmail)).pipe(map(() => workspaceEmail));
            }),
        );
    }
    restore(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Restore, WorkspaceEmail)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.restoreProcess(id).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: 'Workspace email restored',
                };
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateWorkspaceEmailDto): Observable<WorkspaceEmail> {
        const updateData: DeepPartial<WorkspaceEmail> = updateDto;
        return from(this.workspaceEmailRepository.findOne({ where: { id } })).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException('Workspace email not found');
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.emailId && updateDto.emailId !== workspaceEmail.emailId) {
                    tasks.push(
                        this.emailService.findOneData(updateDto.emailId).pipe(
                            tap((email) => {
                                if (!email) {
                                    throw new NotFoundException('Email not found');
                                }
                                return email;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (updateDto.workspaceId && updateDto.workspaceId !== workspaceEmail.workspaceId) {
                    tasks.push(
                        this.workspaceService.findOneData(updateDto.workspaceId).pipe(
                            tap((workspace) => {
                                if (!workspace) {
                                    throw new NotFoundException('Workspace not found');
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
                                    throw new ConflictException('Workspace email already exist');
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
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateWorkspaceEmailDto,
    ): Observable<ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Update, WorkspaceEmail)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((workspaceEmail) => {
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                    message: 'Workspace email updated',
                };
            }),
        );
    }

    checkExistByWorkspaceIdAndEmailId(workspaceId: string, emailId: string): Observable<boolean> {
        return from(this.workspaceEmailRepository.existsBy({ workspaceId, emailId }));
    }
}