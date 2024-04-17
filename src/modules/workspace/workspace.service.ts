import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { Workspace } from './entities/workspace.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { AdminAccountService } from '../admin-account/admin-account.service';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';

@Injectable()
export class WorkspaceService
    implements
        CrudService<
            ApiResponse<Workspace | Workspace | PaginatedData<Workspace>>,
            CreateWorkspaceDto,
            UpdateWorkspaceDto,
            FindAllDto,
            Workspace,
            User
        >
{
    constructor(
        @InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly adminAccountService: AdminAccountService,
    ) {}

    checkExistByAdminAccountId(adminAccountId: string): Observable<boolean> {
        return from(this.workspaceRepository.existsBy({ adminAccountId }));
    }
    create(
        currentUser: User,
        createDto: CreateWorkspaceDto,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
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
                return from(this.workspaceRepository.save(workspace)).pipe(
                    map((data): ApiResponse<Workspace> => {
                        return { status: HttpStatus.CREATED, data, message: 'Workspace created successfully' };
                    }),
                );
            }),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        const fields = ['id', 'description', 'maxSlots', 'adminAccountId'];
        const realations = ['adminAccount'];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch(this.workspaceRepository, findAllDto, fields, searchFields, realations);
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        return from(
            this.workspaceRepository.findOne({
                where: { id },
            }),
        ).pipe(
            map((data) => {
                if (!data) {
                    throw new NotFoundException('Workspace not found');
                }
                return { status: HttpStatus.OK, data };
            }),
        );
    }
    findOneData(id: string): Observable<Workspace> {
        return from(this.workspaceRepository.findOne({ where: { id } }));
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateWorkspaceDto,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        return from(this.findOneData(id)).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                if (updateDto.adminAccountId && updateDto.adminAccountId && workspace.adminAccountId) {
                    return from(this.adminAccountService.findOneData(updateDto.adminAccountId)).pipe(
                        switchMap((adminAccount) => {
                            if (!adminAccount) {
                                throw new NotFoundException('Admin account not found');
                            }
                            return from(this.checkExistByAdminAccountId(updateDto.adminAccountId)).pipe(
                                switchMap((isExist) => {
                                    if (isExist) {
                                        throw new ConflictException('Workspace already exist');
                                    }
                                    return of(workspace);
                                }),
                            );
                        }),
                    );
                } else {
                    return of(workspace);
                }
            }),
            switchMap((workspace) => updateEntity<Workspace>(this.workspaceRepository, workspace, updateDto)),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        return from(this.workspaceRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                if (hardRemove) {
                    if (!workspace.deletedAt) {
                        throw new BadRequestException('Workspace not deleted');
                    }
                    return from(this.workspaceRepository.remove(workspace)).pipe(
                        map(() => {
                            return { status: HttpStatus.OK, message: 'Workspace deleted successfully' };
                        }),
                    );
                }
                return from(this.workspaceRepository.remove(workspace)).pipe(
                    map(() => {
                        return { status: HttpStatus.OK, message: 'Workspace deleted successfully' };
                    }),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Workspace | PaginatedData<Workspace>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Workspace)) {
            throw new BadRequestException('You do not have permission to create workspace');
        }
        return from(this.workspaceRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((workspace) => {
                if (!workspace) {
                    throw new NotFoundException('Workspace not found');
                }
                if (!workspace.deletedAt) {
                    throw new BadRequestException('Workspace not deleted');
                }
                return from(this.workspaceRepository.restore(workspace)).pipe(
                    map(() => {
                        return { status: HttpStatus.OK, message: 'Workspace restored successfully' };
                    }),
                );
            }),
        );
    }
}
