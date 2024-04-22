import { HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import { FindAllDto } from '../../dto/find-all.dto';
import { findWithPaginationAndSearch, SearchField } from '../../helper/pagination';
import { slugifyString } from '../../helper/slug';
import { updateEntity } from '../../helper/update';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { CrudService } from '../../interfaces/crud.interface';
import { AccountCategoryService } from '../account-category/account-category.service';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { User } from '../user/entities/user.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';
@Injectable()
export class AccountService
    implements
        CrudService<
            ApiResponse<Account | Account[] | PaginatedData<Account>>,
            Account,
            PaginatedData<Account>,
            CreateAccountDto,
            UpdateAccountDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountCategoryService: AccountCategoryService,
    ) {}
    createProcess(createDto: CreateAccountDto): Observable<Account> {
        const { name, description, accountCategoryId } = createDto;
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Account already exists');
                }
                return this.accountCategoryService.findOneData(accountCategoryId).pipe(
                    switchMap((accountCategory) => {
                        if (!accountCategory) {
                            throw new NotFoundException('Account category not found');
                        }
                        const account = new Account();
                        account.name = name;
                        account.description = description;
                        account.accountCategory = accountCategory;
                        account.slug = slug;
                        return from(this.accountRepository.save(account));
                    }),
                    catchError((error) => throwError(() => new BadRequestException(error.message))),
                );
            }),
        );
    }
    create(
        currentUser: User,
        createDto: CreateAccountDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to create account');
        }
        return this.createProcess(createDto).pipe(
            map((data) => ({
                status: HttpStatus.CREATED,
                message: 'Account created successfully',
                data,
            })),
        );
    }
    findOneData(id: string): Observable<Account> {
        return from(this.accountRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<Account> {
        return from(this.accountRepository.findOne({ where: { id } }));
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to read account');
        }
        return this.findOneProcess(id).pipe(
            map((data) => ({
                message: 'Account found',
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Account>> {
        const fields: Array<keyof Account> = ['id', 'name', 'description', 'slug'];
        const relations = ['accountCategory'];
        const searchRelation: SearchField[] = [
            {
                tableName: 'accountCategory',
                fields: ['name', 'description'],
            },
        ];
        return findWithPaginationAndSearch<Account>(
            this.accountRepository,
            findAllDto,
            fields,
            searchRelation,
            relations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, Account)) {
            throw new ForbiddenException('You are not allowed to read account');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((data) => ({
                message: 'Accounts found',
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<Account> {
        return from(
            this.accountRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    adminAccounts: !hardRemove,
                },
            }),
        ).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                if (hardRemove) {
                    if (!account.deletedAt) {
                        throw new BadRequestException('Account not deleted yet');
                    }
                    return from(this.accountRepository.remove(account));
                }
                if (account.adminAccounts) {
                    throw new BadRequestException('Account has admin account');
                }
                return from(this.accountRepository.softRemove(account));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to delete account');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((data) => ({
                message: 'Account deleted successfully',
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    restoreProcess(id: string): Observable<Account> {
        return from(this.accountRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                if (!account.deletedAt) {
                    throw new BadRequestException('Account not deleted yet');
                }
                return from(this.accountRepository.restore(account.id)).pipe(map(() => account));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to restore account');
        }
        return this.restoreProcess(id).pipe(
            map((data) => ({
                message: 'Account restored successfully',
                data,
                status: HttpStatus.OK,
            })),
        );
    }
    updateProcess(id: string, updateDto: UpdateAccountDto): Observable<Account> {
        const updateData: DeepPartial<Account> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.name && updateDto.name !== account.name) {
                    const slug = slugifyString(updateDto.name);
                    tasks.push(
                        from(this.checkExistBySlug(slug)).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException('Account already exists');
                                }
                                updateData.slug = slug;
                            }),
                        ),
                    );
                } else {
                    tasks.push(of(null));
                }
                if (updateDto.accountCategoryId && updateDto.accountCategoryId !== account.accountCategory.id) {
                    tasks.push(
                        this.accountCategoryService.findOneData(updateDto.accountCategoryId).pipe(
                            tap((accountCategory) => {
                                if (!accountCategory) {
                                    throw new NotFoundException('Account category not found');
                                }
                                updateData.accountCategory = accountCategory;
                            }),
                        ),
                    );
                } else {
                    tasks.push(of(null));
                }
                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<Account>(this.accountRepository, account, updateData);
                    }),
                );
            }),
        );
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateAccountDto,
    ): Observable<ApiResponse<Account | PaginatedData<Account> | Account[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to update account');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((data) => ({
                message: 'Account updated successfully',
                data,
                status: HttpStatus.OK,
            })),
        );
    }

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountRepository.existsBy({ slug }));
    }

    async findOneBySlug(slug: string): Promise<Account> {
        return this.accountRepository.findOne({ where: { slug } });
    }
}
