import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    FindAllDto,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountService } from '../account/account.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { RentalTypeService } from '../rental-type/rental-type.service';
import { User } from '../user/entities/user.entity';
import { CreateAccountPriceDto } from './dto/create-account-price.dto';
import { UpdateAccountPriceDto } from './dto/update-account-price.dto';
import { AccountPrice } from './entities/account-price.entity';

@Injectable()
export class AccountPriceService
    implements
        CrudService<
            ApiResponse<AccountPrice | AccountPrice[] | PaginatedData<AccountPrice>>,
            AccountPrice,
            PaginatedData<AccountPrice>,
            CreateAccountPriceDto,
            UpdateAccountPriceDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(AccountPrice)
        private readonly accountPriceRepository: Repository<AccountPrice>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly accountService: AccountService,
        private readonly rentalTypeService: RentalTypeService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateAccountPriceDto): Observable<AccountPrice> {
        const { accountId, rentalTypeId, price } = createDto;
        return this.accountService.findOneProcess(accountId).pipe(
            switchMap((account) => {
                if (!account) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Account.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.rentalTypeService.findOneProcess(rentalTypeId);
            }),
            switchMap((rentalType) => {
                if (!rentalType) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.RentalType.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.checkExistByAccountIdAndRentalTypeId(accountId, rentalTypeId);
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.AccountPrice.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const accountPrice = new AccountPrice();
                accountPrice.accountId = accountId;
                accountPrice.rentalTypeId = rentalTypeId;
                accountPrice.price = price;
                const accountPriceCreated = this.accountPriceRepository.create(accountPrice);
                return from(this.accountPriceRepository.save(accountPriceCreated));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(
        currentUser: User,
        createDto: CreateAccountPriceDto,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Create, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<AccountPrice> => ({
                    message: this.i18nService.translate('message.AccountPrice.Created', {
                        lang: I18nContext.current().lang,
                    }),
                    data,
                    status: HttpStatus.CREATED,
                }),
            ),
        );
    }

    findOneProcess(id: string, options?: FindOneOptionsCustom<AccountPrice>): Observable<AccountPrice> {
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                ...options,
            }),
        );
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findOneProcess(id).pipe(
            map((accountPrice): ApiResponse<AccountPrice> => {
                if (!accountPrice) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountPrice.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    data: accountPrice,
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.AccountPrice.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<AccountPrice>> {
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
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
            map(
                (data): ApiResponse<AccountPrice> => ({
                    data,
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.AccountPrice.Found', {
                        lang: I18nContext.current().lang,
                    }),
                }),
            ),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<AccountPrice> {
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {},
            }),
        ).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountPrice.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!accountPrice.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.AccountPrice.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.accountPriceRepository.remove(accountPrice));
                }

                return from(this.accountPriceRepository.remove(accountPrice));
            }),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(
                (): ApiResponse<AccountPrice> => ({
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.AccountPrice.Deleted', {
                        lang: I18nContext.current().lang,
                    }),
                }),
            ),
        );
    }
    restoreProcess(id: string): Observable<AccountPrice> {
        return from(
            this.accountPriceRepository.findOne({
                where: { id },
                withDeleted: true,
            }),
        ).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountPrice.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!accountPrice.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.AccountPrice.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.accountPriceRepository.restore(accountPrice)).pipe(map(() => accountPrice));
            }),
        );
    }
    restore(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map(
                (data): ApiResponse<AccountPrice> => ({
                    data,
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.AccountPrice.Restored', {
                        lang: I18nContext.current().lang,
                    }),
                }),
            ),
        );
    }
    updateProcess(id: string, updateDto: UpdateAccountPriceDto): Observable<AccountPrice> {
        const updateData: DeepPartial<AccountPrice> = {};
        return from(this.findOneProcess(id)).pipe(
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.AccountPrice.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.accountId && accountPrice.accountId !== updateDto.accountId) {
                    tasks.push(
                        this.accountService.findOneProcess(updateData.accountId).pipe(
                            tap((account) => {
                                if (!account) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.Account.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));

                if (updateDto.rentalTypeId && accountPrice.rentalTypeId !== updateDto.rentalTypeId) {
                    tasks.push(
                        this.rentalTypeService.findOneProcess(updateData.rentalTypeId).pipe(
                            tap((rentalType) => {
                                if (!rentalType) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.RentalType.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (
                    (updateDto.accountId && accountPrice.accountId !== updateDto.accountId && updateDto.rentalTypeId) ||
                    (updateDto.rentalTypeId && accountPrice.rentalTypeId !== updateDto.rentalTypeId)
                ) {
                    const checkAccountId = updateDto.accountId || accountPrice.accountId;
                    const checkRentalTypeId = updateDto.rentalTypeId || accountPrice.rentalTypeId;
                    tasks.push(
                        this.checkExistByAccountIdAndRentalTypeId(checkAccountId, checkRentalTypeId).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.AccountPrice.Conflict', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<AccountPrice>(this.accountPriceRepository, accountPrice, updateData);
                    }),
                );
            }),
        );
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateAccountPriceDto,
    ): Observable<ApiResponse<AccountPrice | PaginatedData<AccountPrice> | AccountPrice[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Update, AccountPrice)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.updateProcess(id, updateDto).pipe(
            map(
                (data): ApiResponse<AccountPrice> => ({
                    data,
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.AccountPrice.Updated', {
                        lang: I18nContext.current().lang,
                    }),
                }),
            ),
        );
    }
    checkExistByAccountIdAndRentalTypeId(accountId: string, rentalTypeId: string): Observable<boolean> {
        return from(this.accountPriceRepository.existsBy({ accountId, rentalTypeId }));
    }
}
