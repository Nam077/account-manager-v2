import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { Account } from './entities/account.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { User } from '../user/entities/user.entity';
import { Observable, catchError, forkJoin, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { AccountCategoryService } from '../account-category/account-category.service';
import { ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { slugifyString } from 'src/helper/slug';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class AccountService
    implements
        CrudService<
            ApiResponse<Account | Account[] | PaginatedData<Account>>,
            CreateAccountDto,
            UpdateAccountDto,
            FindAllDto,
            Account,
            User
        >
{
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountCategoryService: AccountCategoryService,
    ) {}

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountRepository.existsBy({ slug }));
    }

    async findOneBySlug(slug: string): Promise<Account> {
        return this.accountRepository.findOne({ where: { slug } });
    }

    create(currentUser: User, createDto: CreateAccountDto): Observable<ApiResponse<Account>> {
        const { name, description, accountCategoryId } = createDto;
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to create account');
        }
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
                        return from(this.accountRepository.save(account)).pipe(
                            map((account): ApiResponse<Account> => {
                                return { message: 'Account created successfully', data: account };
                            }),
                        );
                    }),
                    catchError((error) => throwError(() => new BadRequestException(error.message))),
                );
            }),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<Account>>> {
        const fields = ['id', 'name', 'description', 'slug'];
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
    findOne(currentUser: User, id: string): Observable<ApiResponse<Account>> {
        return from(this.accountRepository.findOne({ where: { id } })).pipe(
            map((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                return {
                    message: 'Account found',
                    data: account,
                };
            }),
        );
    }
    findOneData(id: string): Observable<Account> {
        return from(this.accountRepository.findOne({ where: { id } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateAccountDto): Observable<ApiResponse<Account>> {
        const updateData: DeepPartial<Account> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Update, account)) {
                    throw new ForbiddenException('You are not allowed to update account');
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
                console.log('tasks', tasks);

                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<Account>(this.accountRepository, account, updateData);
                    }),
                );
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<Account>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to delete account');
        }
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
                    return from(this.accountRepository.remove(account)).pipe(
                        map((): ApiResponse<Account> => {
                            return { message: 'Account deleted successfully' };
                        }),
                    );
                }
                if (account.adminAccounts) {
                    throw new BadRequestException('Account has admin account');
                }
                return from(this.accountRepository.softRemove(account)).pipe(
                    map((): ApiResponse<Account> => {
                        return { message: 'Account soft deleted successfully' };
                    }),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Account>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Account)) {
            throw new ForbiddenException('You are not allowed to restore account');
        }
        return from(this.accountRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                if (!account.deletedAt) {
                    throw new BadRequestException('Account not deleted yet');
                }
                return from(this.accountRepository.restore(account.id)).pipe(
                    map((): ApiResponse<Account> => {
                        return { message: 'Account restored successfully' };
                    }),
                );
            }),
        );
    }
}
