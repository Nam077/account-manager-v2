import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateAccountCategoryDto } from './dto/create-account-category.dto';
import { UpdateAccountCategoryDto } from './dto/update-account-category.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { AccountCategory } from './entities/account-category.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { slugifyString } from 'src/helper/slug';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class AccountCategoryService
    implements
        CrudService<
            ApiResponse<AccountCategory | AccountCategory[] | PaginatedData<AccountCategory>>,
            AccountCategory,
            PaginatedData<AccountCategory>,
            CreateAccountCategoryDto,
            UpdateAccountCategoryDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(AccountCategory)
        private readonly accountCategoryRepository: Repository<AccountCategory>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}
    createProcess(createDto: CreateAccountCategoryDto): Observable<AccountCategory> {
        const { name, description } = createDto;
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Account category already exists');
                }
                const accountCategory = new AccountCategory();
                accountCategory.name = name;
                accountCategory.description = description;
                accountCategory.slug = slug;
                return from(this.accountCategoryRepository.save(accountCategory));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateAccountCategoryDto): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to create account category');
        }
        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.CREATED,
                    message: 'Account category created successfully',
                    data,
                }),
            ),
        );
    }
    findOneData(id: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { id } })).pipe(
            map((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                return accountCategory;
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Read, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to read account category');
        }
        return this.findOneProcess(id).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                }),
            ),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<AccountCategory>> {
        const fields: Array<keyof AccountCategory> = ['id', 'name', 'description', 'slug'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<AccountCategory>(
            this.accountCategoryRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<AccountCategory>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to read account category');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data,
                message: 'Account category found',
            })),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<AccountCategory> {
        return from(
            this.accountCategoryRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: { accounts: !hardRemove },
            }),
        ).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                if (hardRemove) {
                    if (!accountCategory.deletedAt) {
                        throw new BadRequestException('Account category not deleted');
                    }
                    return from(this.accountCategoryRepository.remove(accountCategory));
                }
                if (accountCategory.accounts) {
                    throw new BadRequestException('Account category has accounts');
                }
                return from(this.accountCategoryRepository.softRemove(accountCategory));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Delete, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to delete account category');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                }),
            ),
        );
    }
    restoreProcess(id: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                if (!accountCategory.deletedAt) {
                    throw new BadRequestException('Account category not deleted yet');
                }
                return from(this.accountCategoryRepository.restore(accountCategory.id)).pipe(
                    map(() => accountCategory),
                );
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Restore, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to restore account category');
        }
        return this.restoreProcess(id).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                }),
            ),
        );
    }
    updateProcess(id: string, updateDto: UpdateAccountCategoryDto): Observable<AccountCategory> {
        const updateData: DeepPartial<AccountCategory> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                if (updateData.name && accountCategory.name !== updateData.name) {
                    return from(this.checkExistBySlug(slugifyString(updateData.name))).pipe(
                        switchMap((isExist) => {
                            if (isExist) {
                                throw new ConflictException('Account category already exists');
                            }
                            updateData.slug = slugifyString(updateData.name);
                            return of(accountCategory);
                        }),
                    );
                }
                return of(accountCategory);
            }),
            switchMap((accountCategory) => {
                return updateEntity<AccountCategory>(this.accountCategoryRepository, accountCategory, updateData);
            }),
        );
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateAccountCategoryDto,
    ): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Update, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to update account category');
        }
        return this.updateProcess(id, updateDto).pipe(
            map(
                (data): ApiResponse<AccountCategory> => ({
                    status: HttpStatus.OK,
                    data,
                }),
            ),
        );
    }
    findOneBySlug(slug: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { slug } }));
    }
    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountCategoryRepository.existsBy({ slug }));
    }
}
