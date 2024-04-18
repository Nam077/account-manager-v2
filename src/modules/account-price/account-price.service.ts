import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateAccountPriceDto } from './dto/create-account-price.dto';
import { UpdateAccountPriceDto } from './dto/update-account-price.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { AccountPrice } from './entities/account-price.entity';
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { AccountService } from '../account/account.service';
import { RentalTypeService } from '../rental-type/rental-type.service';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { CheckForForkJoin, updateEntity } from 'src/helper/update';

@Injectable()
export class AccountPriceServicez
    implements
        CrudService<
            ApiResponse<AccountPrice | AccountPrice[] | PaginatedData<AccountPrice>>,
            CreateAccountPriceDto,
            UpdateAccountPriceDto,
            FindAllDto,
            AccountPrice,
            User
        >
{
    constructor(
        @InjectRepository(AccountPrice) private readonly accountPriceRepository: Repository<AccountPrice>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountService: AccountService,
        private readonly rentalTypeService: RentalTypeService,
    ) {}
    checkExistByAccountIdAndRentalTypeId(accountId: string, rentalTypeId: string): Observable<boolean> {
        return from(this.accountPriceRepository.existsBy({ accountId, rentalTypeId }));
    }
    create(currentUser: User, createDto: CreateAccountPriceDto): Observable<ApiResponse<AccountPrice>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Create, AccountPrice)) {
            throw new ForbiddenException('You are not allowed to create account price');
        }
        const { accountId, rentalTypeId, price } = createDto;
        return this.accountService.findOneData(accountId).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException('Account not found');
                }
                return this.rentalTypeService.findOneData(rentalTypeId);
            }),
            switchMap((rentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                return this.checkExistByAccountIdAndRentalTypeId(accountId, rentalTypeId);
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Account price already exists');
                }
                const accountPrice = new AccountPrice();
                accountPrice.accountId = accountId;
                accountPrice.rentalTypeId = rentalTypeId;
                accountPrice.price = price;
                const accountPriceCreated = this.accountPriceRepository.create(accountPrice);
                return from(this.accountPriceRepository.save(accountPriceCreated));
            }),
            map(
                (data): ApiResponse<AccountPrice> => ({
                    status: HttpStatus.CREATED,
                    message: 'Account price created successfully',
                    data,
                }),
            ),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<AccountPrice>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, AccountPrice)) {
            throw new ForbiddenException('You are not allowed to read account price');
        }
        const fields: Array<keyof AccountPrice> = ['id', 'accountId', 'rentalTypeId', 'price'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<AccountPrice>(
            this.accountPriceRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<AccountPrice>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Read, AccountPrice)) {
            throw new ForbiddenException('You are not allowed to read account price');
        }
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                relations: ['account', 'rentalType'],
            }),
        ).pipe(
            map((data) => {
                if (!data) {
                    throw new NotFoundException('Account price not found');
                }
                return {
                    status: HttpStatus.OK,
                    message: 'Account price found',
                    data,
                };
            }),
        );
    }
    findOneData(id: string): Observable<AccountPrice> {
        return from(this.accountPriceRepository.findOne({ where: { id } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateAccountPriceDto): Observable<ApiResponse<AccountPrice>> {
        const updateData: DeepPartial<AccountPrice> = { ...updateDto };
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountPrice)) {
            throw new ForbiddenException('You are not allowed to update account price');
        }
        return from(this.findOneData(id)).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException('Account price not found');
                }
                const tasks: Observable<any>[] = [];
                const check: CheckForForkJoin = {};
                if (updateDto.accountId && accountPrice.accountId !== updateDto.accountId) {
                    tasks.push(this.accountService.findOneData(updateData.accountId));
                    check.account = true;
                } else tasks.push(of(null));

                if (updateDto.rentalTypeId && accountPrice.rentalTypeId !== updateDto.rentalTypeId) {
                    tasks.push(this.rentalTypeService.findOneData(updateData.rentalTypeId));
                    check.rentalType = true;
                } else tasks.push(of(null));
                if (
                    (updateDto.accountId && accountPrice.accountId !== updateDto.accountId && updateDto.rentalTypeId) ||
                    (updateDto.rentalTypeId && accountPrice.rentalTypeId !== updateDto.rentalTypeId)
                ) {
                    const checkAccountId = updateDto.accountId || accountPrice.accountId;
                    const checkRentalTypeId = updateDto.rentalTypeId || accountPrice.rentalTypeId;
                    check.isExist = true;
                    tasks.push(this.checkExistByAccountIdAndRentalTypeId(checkAccountId, checkRentalTypeId));
                } else tasks.push(of(false));
                return forkJoin(tasks).pipe(
                    switchMap(([account, rentalType, isExist]) => {
                        if (check.account && !account) {
                            throw new NotFoundException('Account not found');
                        }
                        if (check.rentalType && !rentalType) {
                            throw new NotFoundException('Rental type not found');
                        }
                        if (isExist) {
                            throw new ConflictException('Account price already exists');
                        }
                        return updateEntity<AccountPrice>(this.accountPriceRepository, accountPrice, updateData);
                    }),
                );
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<AccountPrice>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, AccountPrice)) {
            throw new ForbiddenException('You are not allowed to delete account price');
        }
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {},
            }),
        ).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException('Account price not found');
                }
                if (hardRemove) {
                    if (!accountPrice.deletedAt) {
                        throw new BadRequestException('Account price is not deleted');
                    }
                    return from(this.accountPriceRepository.remove(accountPrice)).pipe(
                        map(() => ({
                            status: HttpStatus.OK,
                            message: 'Account price deleted successfully',
                        })),
                    );
                }

                return from(this.accountPriceRepository.remove(accountPrice)).pipe(
                    map(() => ({
                        status: HttpStatus.OK,
                        message: 'Account price deleted successfully',
                    })),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<AccountPrice>> {
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                withDeleted: true,
            }),
        ).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException('Account price not found');
                }
                if (!accountPrice.deletedAt) {
                    throw new BadRequestException('Account price is not deleted');
                }
                return from(this.accountPriceRepository.restore(accountPrice)).pipe(
                    map(() => ({
                        status: HttpStatus.OK,
                        message: 'Account price restored successfully',
                    })),
                );
            }),
        );
    }
}
