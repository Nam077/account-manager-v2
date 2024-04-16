import {
    ConflictException,
    ForbiddenException,
    HttpException,
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
import { findWithPaginationAndSearch } from 'src/helper/pagination';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class AccountCategoryService
    implements
        CrudService<
            ApiResponse<AccountCategory | AccountCategory[] | PaginatedData<AccountCategory>>,
            CreateAccountCategoryDto,
            UpdateAccountCategoryDto,
            FindAllDto,
            AccountCategory,
            User
        >
{
    constructor(
        @InjectRepository(AccountCategory)
        private readonly accountCategoryRepository: Repository<AccountCategory>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}
    findOneBySlug(slug: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { slug } }));
    }
    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.accountCategoryRepository.existsBy({ slug }));
    }
    create(currentUser: User, createDto: CreateAccountCategoryDto): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Create, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to create account category');
        }
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
                return from(this.accountCategoryRepository.save(accountCategory)).pipe(
                    map((accountCategory) => ({
                        success: true,
                        data: accountCategory,
                    })),
                );
            }),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<AccountCategory>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to read account category');
        }
        const fields = ['id', 'name', 'description', 'slug'];
        return findWithPaginationAndSearch<AccountCategory>(this.accountCategoryRepository, findAllDto, fields);
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<AccountCategory>> {
        return from(this.accountCategoryRepository.findOne({ where: { id } })).pipe(
            map((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                return {
                    message: 'Account category found',
                    data: accountCategory,
                };
            }),
        );
    }
    findOneData(id: string): Observable<AccountCategory> {
        return from(this.accountCategoryRepository.findOne({ where: { id } }));
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateAccountCategoryDto,
    ): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to update account category');
        }
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
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to delete account category');
        }
        return from(this.accountCategoryRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                if (hardRemove) {
                    if (!accountCategory.deletedAt) {
                        throw new HttpException('Account category not deleted', HttpStatus.BAD_REQUEST);
                    }
                    return from(this.accountCategoryRepository.remove(accountCategory)).pipe(
                        map(() => ({
                            message: 'Account category deleted',
                        })),
                    );
                }
                return from(this.accountCategoryRepository.softRemove(accountCategory)).pipe(
                    map(() => ({
                        message: 'Account category deleted',
                    })),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<AccountCategory>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountCategory)) {
            throw new ForbiddenException('You are not allowed to restore account category');
        }
        return from(this.accountCategoryRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((accountCategory) => {
                if (!accountCategory) {
                    throw new NotFoundException('Account category not found');
                }
                return from(this.accountCategoryRepository.restore(accountCategory)).pipe(
                    map(() => ({
                        message: 'Account category restored',
                    })),
                );
            }),
        );
    }
}
