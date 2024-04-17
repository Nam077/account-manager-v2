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
import { Admin, DeepPartial, Repository } from 'typeorm';
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
            CreateAdminAccountDto,
            UpdateAdminAccountDto,
            FindAllDto,
            AdminAccount,
            User
        >
{
    constructor(
        @InjectRepository(AdminAccount)
        private readonly adminAccountRepository: Repository<AdminAccount>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountService: AccountService,
    ) {}

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

    create(currentUser: User, createDto: CreateAdminAccountDto): Observable<ApiResponse<AdminAccount>> {
        const { email, accountId, value } = createDto;
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to create admin account');
        }
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
                        return from(this.adminAccountRepository.save(newAdminAccount)).pipe(
                            map((adminAccount): ApiResponse<AdminAccount> => {
                                return {
                                    status: HttpStatus.CREATED,
                                    message: 'Admin account created successfully',
                                    data: adminAccount,
                                };
                            }),
                        );
                    }),
                    catchError((error) => throwError(() => new BadRequestException(error.message))),
                );
            }),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<AdminAccount>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to read admin account');
        }
        const fields = ['id', 'email', 'value'];
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
    findOne(currentUser: User, id: string): Observable<ApiResponse<AdminAccount>> {
        return from(this.adminAccountRepository.findOne({ where: { id } })).pipe(
            map((adminAccount): ApiResponse<AdminAccount> => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                return {
                    message: 'Admin account found',
                    data: adminAccount,
                };
            }),
        );
    }
    findOneData(id: string): Observable<AdminAccount> {
        return from(this.adminAccountRepository.findOne({ where: { id } }));
    }
    findOneForCreateWorkSpace(id: string): Observable<AdminAccount> {
        return from(this.adminAccountRepository.findOne({ where: { id }, relations: { account: true } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateAdminAccountDto): Observable<ApiResponse<AdminAccount>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Update, AdminAccount)) {
            throw new ForbiddenException('You are not allowed to update admin account');
        }
        const updateData: DeepPartial<AdminAccount> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                const emailCheck = updateDto.email ? updateDto.email : adminAccount.email;
                const idAccountCheck = updateDto.accountId ? updateDto.accountId : adminAccount.accountId;

                if (
                    (updateDto.email && updateDto.email !== adminAccount.email) ||
                    (updateDto.accountId && updateDto.accountId !== adminAccount.accountId)
                ) {
                    return from(this.checkExistByEmailAndAccountId(emailCheck, idAccountCheck)).pipe(
                        switchMap((isExist) => {
                            if (isExist) {
                                throw new ConflictException('Admin account already exists');
                            }
                            if (updateDto.accountId && updateDto.accountId !== adminAccount.accountId) {
                                return this.accountService.findOneData(updateDto.accountId).pipe(
                                    switchMap((account) => {
                                        if (!account) {
                                            throw new NotFoundException('Account not found');
                                        }
                                        return of(adminAccount);
                                    }),
                                );
                            }
                            delete updateData.accountId;
                            return of(adminAccount);
                        }),
                    );
                } else return of(adminAccount);
            }),
            switchMap((adminAccount) => {
                return updateEntity<AdminAccount>(this.adminAccountRepository, adminAccount, updateData);
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<AdminAccount>> {
        return from(
            this.adminAccountRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
            }),
        ).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Manage, adminAccount)) {
                    throw new ForbiddenException('You are not allowed to remove admin account');
                }
                if (hardRemove) {
                    if (!adminAccount.deletedAt) {
                        throw new BadRequestException('Admin account not deleted');
                    }
                    return from(this.adminAccountRepository.remove(adminAccount)).pipe(
                        map(
                            (): ApiResponse<AdminAccount> => ({
                                message: 'Admin account removed successfully',
                            }),
                        ),
                    );
                }
                return from(this.adminAccountRepository.softRemove(adminAccount)).pipe(
                    map(
                        (): ApiResponse<AdminAccount> => ({
                            message: 'Admin account removed successfully',
                        }),
                    ),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<AdminAccount>> {
        return from(this.adminAccountRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((adminAccount) => {
                if (!adminAccount) {
                    throw new NotFoundException('Admin account not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Manage, adminAccount)) {
                    throw new ForbiddenException('You are not allowed to restore admin account');
                }
                return from(this.adminAccountRepository.restore(adminAccount.id)).pipe(
                    map(
                        (): ApiResponse<AdminAccount> => ({
                            message: 'Admin account restored successfully',
                        }),
                    ),
                );
            }),
        );
    }
}
