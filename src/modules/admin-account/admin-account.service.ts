import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { AdminAccount } from './entities/admin-account.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, catchError, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { AccountService } from '../account/account.service';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class AdminAccountService
    implements
        CrudService<
            ApiResponse<AdminAccount | AdminAccount[] | PaginatedData<AdminAccount>>,
            AdminAccount,
            PaginatedData<AdminAccount>,
            CreateAdminAccountDto,
            UpdateAdminAccountDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(AdminAccount)
        private readonly adminAccountRepository: Repository<AdminAccount>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountService: AccountService,
    ) {}
    createProcess(createDto: CreateAdminAccountDto): Observable<AdminAccount> {
        const { email, accountId, value } = createDto;

        return from(this.findByEmailAndAcountId(email, accountId)).pipe(
            switchMap((adminAccount) => {
                if (adminAccount) {
                    throw new ConflictException('Admin account already exists');
                }
                return this.accountService.findOneData(accountId).pipe(
                    switchMap((account) => {
                        if (!account) {
                            throw new NotFoundException('Account not found');
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
    create(currentUser: User, createDto: CreateAdminAccountDto): Observable<ApiResponse<AdminAccount>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Create, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to create admin account');
        }

        return this.createProcess(createDto).pipe(
            map((data) => ({
                status: HttpStatus.CREATED,
                message: 'Admin account created successfully',
                data,
            })),
        );
    }
    findOneData(id: string): Observable<AdminAccount> {
        return from(this.adminAccountRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<AdminAccount> {
        return from(this.adminAccountRepository.findOne({ where: { id } })).pipe(
            map((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                return adminAccount;
            }),
        );
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Read, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to read admin account');
        }
        return this.findOneProcess(id).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Admin account found',
            })),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<AdminAccount>> {
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
            searchFields,
            relations,
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<AdminAccount>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to read admin account');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Admin account found',
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
                    throw new NotFoundException('Admin account not found');
                }
                if (hardRemove) {
                    if (!adminAccount.deletedAt) {
                        throw new BadRequestException('Admin account not deleted');
                    }
                    return from(this.adminAccountRepository.remove(adminAccount));
                }
                if (adminAccount.workspaces) {
                    if (adminAccount.workspaces.length > 0) {
                        throw new BadRequestException('Admin account has workspaces');
                    }
                }

                return from(this.adminAccountRepository.softRemove(adminAccount));
            }),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Delete, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to delete admin account');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Admin account deleted successfully',
            })),
        );
    }
    restoreProcess(id: string): Observable<AdminAccount> {
        return from(this.adminAccountRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                if (!adminAccount.deletedAt) {
                    throw new BadRequestException('Admin account not deleted');
                }
                return from(this.adminAccountRepository.restore(adminAccount.id)).pipe(map(() => adminAccount));
            }),
        );
    }
    restore(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Restore, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to restore admin account');
        }
        return this.restoreProcess(id).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Admin account restored successfully',
            })),
        );
    }
    updateProcess(id: string, updateDto: UpdateAdminAccountDto): Observable<AdminAccount> {
        const updateData: DeepPartial<AdminAccount> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                const checkEmail = updateDto.email || adminAccount.email;
                const checkAccountId = updateDto.accountId || adminAccount.accountId;
                const tasks: Observable<any>[] = [];
                if (updateDto.accountId && updateDto.accountId !== adminAccount.accountId) {
                    tasks.push(
                        this.accountService.findOneData(updateDto.accountId).pipe(
                            tap((account) => {
                                if (!account) {
                                    throw new NotFoundException('Account not found');
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
                                    throw new ConflictException('Admin account already exists');
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
        currentUser: User,
        id: string,
        updateDto: UpdateAdminAccountDto,
    ): Observable<ApiResponse<AdminAccount | PaginatedData<AdminAccount> | AdminAccount[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Update, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to update admin account');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Admin account updated successfully',
            })),
        );
    }

    findByEmailAndAcountId(email: string, accountId: string): Observable<AdminAccount> {
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
