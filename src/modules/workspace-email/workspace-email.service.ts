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
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { WorkspaceService } from '../workspace/workspace.service';
import { EmailService } from '../email/email.service';
import { CheckForForkJoin, updateEntity } from 'src/helper/update';
@Injectable()
export class WorkspaceEmailService
    implements
        CrudService<
            ApiResponse<WorkspaceEmail | WorkspaceEmail[] | PaginatedData<WorkspaceEmail>>,
            CreateWorkspaceEmailDto,
            UpdateWorkspaceEmailDto,
            FindAllDto,
            WorkspaceEmail,
            User
        >
{
    constructor(
        @InjectRepository(WorkspaceEmail) private readonly workspaceEmailRepository: Repository<WorkspaceEmail>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly workspaceService: WorkspaceService,
        private readonly emailService: EmailService,
    ) {}

    checkExistByWorkspaceIdAndEmailId(workspaceId: string, emailId: string): Observable<boolean> {
        return from(this.workspaceEmailRepository.existsBy({ workspaceId, emailId }));
    }
    create(currentUser: User, createDto: CreateWorkspaceEmailDto): Observable<ApiResponse<WorkspaceEmail>> {
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
            switchMap((workspaceEmail) =>
                from(this.workspaceEmailRepository.findOne({ where: { id: workspaceEmail.id } })),
            ),
            map(
                (workspaceEmail): ApiResponse<WorkspaceEmail> => ({
                    status: HttpStatus.CREATED,
                    data: workspaceEmail,
                }),
            ),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<WorkspaceEmail>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, WorkspaceEmail)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        const fields: Array<keyof WorkspaceEmail> = ['id', 'workspaceId', 'emailId'];
        const realations = ['adminAccount'];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<WorkspaceEmail>(
            this.workspaceEmailRepository,
            findAllDto,
            fields,
            searchFields,
            realations,
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<WorkspaceEmail>> {
        return from(this.workspaceEmailRepository.findOne({ where: { id } })).pipe(
            map((workspaceEmail): ApiResponse<WorkspaceEmail> => {
                if (!workspaceEmail) {
                    throw new NotFoundException('Workspace email not found');
                }
                return {
                    status: HttpStatus.OK,
                    data: workspaceEmail,
                };
            }),
        );
    }
    findOneData(id: string): Observable<WorkspaceEmail> {
        return from(this.workspaceEmailRepository.findOne({ where: { id } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateWorkspaceEmailDto): Observable<ApiResponse<WorkspaceEmail>> {
        const updateData: DeepPartial<WorkspaceEmail> = updateDto;
        return from(this.workspaceEmailRepository.findOne({ where: { id } })).pipe(
            switchMap((workspaceEmail) => {
                if (!workspaceEmail) {
                    throw new NotFoundException('Workspace email not found');
                }
                const checkForForkJoin: CheckForForkJoin = {};
                const tasks: Observable<any>[] = [];
                if (updateDto.emailId && updateDto.emailId !== workspaceEmail.emailId) {
                    tasks.push(this.emailService.findOneData(updateDto.emailId));
                    checkForForkJoin.email = true;
                } else tasks.push(of(null));
                if (updateDto.workspaceId && updateDto.workspaceId !== workspaceEmail.workspaceId) {
                    tasks.push(this.workspaceService.findOneData(updateDto.workspaceId));
                    checkForForkJoin.workspace = true;
                } else tasks.push(of(null));
                if (
                    (updateDto.emailId && updateDto.emailId !== workspaceEmail.emailId) ||
                    (updateDto.workspaceId && updateDto.workspaceId !== workspaceEmail.workspaceId)
                ) {
                    const checkEmailId = updateDto.emailId || workspaceEmail.emailId;
                    const checkWorkspaceId = updateDto.workspaceId || workspaceEmail.workspaceId;
                    tasks.push(this.checkExistByWorkspaceIdAndEmailId(checkWorkspaceId, checkEmailId));
                    checkForForkJoin.isExist = true;
                } else tasks.push(of(false));
                return forkJoin(tasks).pipe(
                    switchMap(([email, workspace, isExist]) => {
                        if (checkForForkJoin.email && !email) {
                            throw new NotFoundException('Email not found');
                        }
                        if (checkForForkJoin.workspace && !workspace) {
                            throw new NotFoundException('Workspace not found');
                        }
                        if (isExist) {
                            throw new ConflictException('Workspace email already exist');
                        }
                        return updateEntity<WorkspaceEmail>(this.workspaceEmailRepository, workspaceEmail, updateData);
                    }),
                );
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<WorkspaceEmail>> {
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
            map(
                (): ApiResponse<WorkspaceEmail> => ({
                    status: HttpStatus.OK,
                    message: 'Workspace email deleted successfully',
                }),
            ),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<WorkspaceEmail>> {
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
                return from(this.workspaceEmailRepository.restore(workspaceEmail));
            }),
            map(
                (): ApiResponse<WorkspaceEmail> => ({
                    status: HttpStatus.OK,
                    message: 'Workspace email restored successfully',
                }),
            ),
        );
    }
}
