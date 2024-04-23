import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    FindAllDto,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
} from '../../common';
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
        @InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly adminAccountService: AdminAccountService,
    ) {}
    createProcess(createDto: CreateWorkspaceDto): Observable<Workspace> {
        const { adminAccountId, description, maxSlots } = createDto;
        return from(this.checkExistByAdminAccountId(adminAccountId)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Workspace already exist');
                }
                return this.adminAccountService.findOneData(adminAccountId);
            }),
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
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
            throw new BadRequestException('You are not allowed to create workspace');
        }
        return this.createProcess(createDto).pipe(map((data) => ({ data, status: HttpStatus.CREATED })));
    }
    findOneData(id: string): Observable<Workspace> {
        return from(
            this.workspaceRepository.findOne({
                where: { id },
                relations: { adminAccount: true },
            }),
        );
    }
    findOneWithAdminAccount(id: string): Observable<Workspace> {
        return from(
            this.workspaceRepository.findOne({
                where: { id },
                relations: { adminAccount: { account: true } },
            }),
        );
    }
    findOneWithWorkspaceEmails(id: string): Observable<Workspace> {
        return from(
            this.workspaceRepository.findOne({
                where: { id },
                relations: { workspaceEmails: true },
            }),
        );
    }
    findOneProcess(id: string): Observable<Workspace> {
        return this.findOneData(id).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                return of(workspace);
            }),
        );
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Workspace)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.findOneProcess(id).pipe(map((data) => ({ data, status: HttpStatus.OK })));
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
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace> | Workspace[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.ReadAll, Workspace)) {
            throw new ForbiddenException('You are not allowed to access this resource');
        }
        return this.findAllProcess(findAllDto).pipe(map((data) => ({ data, status: HttpStatus.OK })));
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
                    throw new NotFoundException('Workspace not found');
                }
                if (hardRemove) {
                    if (!workspace.deletedAt) {
                        throw new BadRequestException('Workspace not deleted');
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
            throw new ForbiddenException('You are not allowed to delete this resource');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({ data, status: HttpStatus.OK, message: 'Workspace deleted' })),
        );
    }
    restoreProcess(id: string): Observable<Workspace> {
        return from(this.workspaceRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                if (!workspace.deletedAt) {
                    throw new BadRequestException('Workspace not deleted');
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
            throw new ForbiddenException('You are not allowed to restore this resource');
        }
        return this.restoreProcess(id).pipe(
            map((data) => ({ data, status: HttpStatus.OK, message: 'Workspace restored' })),
        );
    }
    updateProcess(id: string, updateDto: UpdateWorkspaceDto): Observable<Workspace> {
        const updateData: DeepPartial<Workspace> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.adminAccountId && updateDto.adminAccountId !== workspace.adminAccountId) {
                    tasks.push(
                        this.adminAccountService.findOneData(updateDto.adminAccountId).pipe(
                            tap((adminAccount) => {
                                if (!adminAccount) {
                                    throw new NotFoundException('Admin account not found');
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
            throw new ForbiddenException('You are not allowed to update this resource');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({ data, status: HttpStatus.OK, message: 'Workspace updated' })),
        );
    }

    checkExistByAdminAccountId(adminAccountId: string): Observable<boolean> {
        return from(this.workspaceRepository.existsBy({ adminAccountId }));
    }
}
