import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { Repository } from 'typeorm';

import {
    ActionCasl,
    addDate,
    ApiResponse,
    calculatorTotalPrice,
    checkDateBefore,
    checkDateBeforeNoEqual,
    checkDateEqual,
    checkDateRenew,
    CrudService,
    CustomCondition,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    RentalStatus,
    SearchField,
    UserAuth,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountPriceService } from '../account-price/account-price.service';
import { AccountPrice } from '../account-price/entities/account-price.entity';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { Rental } from '../rental/entities/rental.entity';
import { RentalService } from '../rental/rental.service';
import { WorkspaceEmailService } from '../workspace-email/workspace-email.service';
import { CreateRentalRenewDto } from './dto/create-rental-renew.dto';
import { FindAllRentalRenewDto } from './dto/find-all.dto';
import { UpdateRentalRenewDto } from './dto/update-rental-renew.dto';
import { RentalRenew } from './entities/rental-renew.entity';

@Injectable()
export class RentalRenewService
    implements
        CrudService<
            ApiResponse<RentalRenew | RentalRenew[] | PaginatedData<RentalRenew>>,
            RentalRenew,
            PaginatedData<RentalRenew>,
            CreateRentalRenewDto,
            UpdateRentalRenewDto,
            FindAllRentalRenewDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(RentalRenew) private readonly rentalRenewRepository: Repository<RentalRenew>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
        private readonly accountPriceService: AccountPriceService,
        private readonly workspaceEmailService: WorkspaceEmailService,
        @Inject(forwardRef(() => RentalService))
        private readonly rentalService: RentalService,
    ) {}

    checkDate(currentDate: Date, newEndDate: Date): boolean {
        return Date.parse(currentDate.toString()) < Date.parse(newEndDate.toString());
    }

    createProcess(createDto: CreateRentalRenewDto): Observable<RentalRenew> {
        const { rentalId, warrantyFee, note, discount, paymentMethod, accountPriceId, startDate } = createDto;

        const recordContext: {
            rental: Rental;
            accountPrice: AccountPrice;
        } = {
            rental: null,
            accountPrice: null,
        };

        return this.rentalService
            .findOneProcess(rentalId, {
                relations: {
                    rentalType: true,
                },
            })
            .pipe(
                switchMap((rental) => {
                    if (!rental) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.Rental.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    if (!checkDateRenew(rental.endDate, startDate)) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.RentalRenew.InvalidDate', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    recordContext.rental = rental;

                    return this.accountPriceService.findOneProcess(accountPriceId, {
                        relations: { rentalType: true },
                    });
                }),
                switchMap((accountPrice) => {
                    if (!accountPrice) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.AccountPrice.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    if (recordContext.rental.rentalType.type !== accountPrice.rentalType.type) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.RentalRenew.InvalidRentalTypeAccountPrice', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    let newEndDate: Date = recordContext.rental.endDate;
                    let startDateNew: Date = startDate;

                    if (checkDateBefore(startDate, newEndDate)) {
                        newEndDate = startDate;
                        startDateNew = recordContext.rental.endDate;
                    }

                    const endDateNew = addDate(startDateNew, accountPrice.validityDuration);

                    const rentalRenew = new RentalRenew();

                    rentalRenew.rentalId = recordContext.rental.id;
                    rentalRenew.accountPriceId = accountPrice.id;
                    rentalRenew.warrantyFee = warrantyFee;
                    rentalRenew.note = note;
                    rentalRenew.discount = discount;
                    rentalRenew.paymentMethod = paymentMethod;
                    rentalRenew.newEndDate = endDateNew;
                    rentalRenew.lastStartDate = recordContext.rental.endDate;
                    const totalPrice = calculatorTotalPrice(accountPrice.price, discount);

                    rentalRenew.paymentAmount = totalPrice - (totalPrice * discount) / 100;

                    return of(this.rentalRenewRepository.create(rentalRenew));
                }),
                switchMap((rentalRenew) => {
                    return from(this.rentalRenewRepository.save(rentalRenew));
                }),
                switchMap((rentalRenew) => {
                    let status = RentalStatus.EXPIRED;

                    if (checkDateBefore(new Date(), rentalRenew.newEndDate)) {
                        status = RentalStatus.ACTIVE;
                    }

                    return this.rentalService
                        .updateProcess(recordContext.rental.id, {
                            endDate: rentalRenew.newEndDate,
                            status: status,
                        })
                        .pipe(
                            switchMap(() => {
                                if (
                                    recordContext.rental.workspaceEmail &&
                                    recordContext.rental.workspaceEmail.status !== RentalStatus.ACTIVE
                                ) {
                                    return this.workspaceEmailService
                                        .updateProcess(recordContext.rental.workspaceEmail.id, {
                                            status: RentalStatus.ACTIVE,
                                        })
                                        .pipe(map(() => rentalRenew));
                                } else {
                                    return of(rentalRenew);
                                }
                            }),
                        );
                }),
            );
    }

    create(currentUser: UserAuth, createDto: CreateRentalRenewDto): Observable<ApiResponse<RentalRenew>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Create, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.createProcess(createDto).pipe(
            map((rentalRenew) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Created', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenew,
                    status: HttpStatus.CREATED,
                };
            }),
        );
    }

    findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<RentalRenew>,
        isWithDeleted?: boolean,
    ): Observable<RentalRenew> {
        return from(
            this.rentalRenewRepository.findOne({
                where: { id },
                ...options,
                withDeleted: isWithDeleted,
            }),
        );
    }

    findOne(
        currentUser: UserAuth,
        id: string,
    ): Observable<ApiResponse<RentalRenew | PaginatedData<RentalRenew> | RentalRenew[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Read, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, RentalRenew);

        return this.findOneProcess(
            id,
            {
                relations: { rental: true },
            },
            isCanReadWithDeleted,
        ).pipe(
            map((rentalRenew) => {
                if (!rentalRenew) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return {
                    message: this.i18nService.translate('message.RentalRenew.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenew,
                    status: HttpStatus.OK,
                };
            }),
        );
    }

    findAllProcess(findAllDto: FindAllRentalRenewDto, isWithDeleted?: boolean): Observable<PaginatedData<RentalRenew>> {
        const fields: Array<keyof RentalRenew> = ['id', 'rentalId'];
        const relations = ['rental'];
        const searchFields: SearchField[] = [];

        return findWithPaginationAndSearch<RentalRenew>(
            this.rentalRenewRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }

    findAll(
        currentUser: UserAuth,
        findAllDto: FindAllRentalRenewDto,
    ): Observable<ApiResponse<PaginatedData<RentalRenew>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.ReadAll, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Rental);

        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((rentalRenews) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenews,
                    status: HttpStatus.OK,
                };
            }),
        );
    }

    findLastByIdRentalOrderByEndDate(id: string): Observable<RentalRenew> {
        return from(
            this.rentalRenewRepository.findOne({
                where: { rentalId: id },
                order: {
                    newEndDate: 'DESC',
                },
                relations: {
                    rental: true,
                },
            }),
        );
    }

    softRemoveByRentalId(id: string): Observable<RentalRenew[]> {
        return from(this.rentalRenewRepository.softDelete({ rentalId: id })).pipe(
            switchMap(() => {
                return from(this.rentalRenewRepository.find({ where: { rentalId: id }, withDeleted: true }));
            }),
        );
    }

    hardRemoveByRentalId(id: string): Observable<RentalRenew[]> {
        return from(this.rentalRenewRepository.delete({ rentalId: id })).pipe(
            switchMap(() => {
                return from(this.rentalRenewRepository.find({ where: { rentalId: id }, withDeleted: true }));
            }),
        );
    }

    restoreByRentalId(id: string): Observable<RentalRenew[]> {
        return from(this.rentalRenewRepository.restore({ rentalId: id })).pipe(
            switchMap(() => {
                return from(this.rentalRenewRepository.find({ where: { rentalId: id }, withDeleted: true }));
            }),
        );
    }

    removeProcess(id: string, hardRemove?: boolean): Observable<RentalRenew> {
        return this.findOneProcess(
            id,
            {
                relations: { rental: true },
            },
            true,
        ).pipe(
            map((rentalRenew) => {
                if (!rentalRenew) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return rentalRenew;
            }),
            switchMap((rentalRenew) => {
                if (!rentalRenew) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (hardRemove) {
                    if (!rentalRenew.deletedAt) {
                        throw new ForbiddenException(
                            this.i18nService.translate('message.RentalRenew.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    if (checkDateEqual(rentalRenew.newEndDate, rentalRenew.rental.endDate)) {
                        return this.rentalService
                            .updateProcess(rentalRenew.rental.id, {
                                endDate: rentalRenew.lastStartDate,
                                status: checkDateBeforeNoEqual(rentalRenew.lastStartDate, new Date())
                                    ? RentalStatus.EXPIRED
                                    : rentalRenew.rental.status,
                            })
                            .pipe(map(() => rentalRenew));
                    }

                    return of(rentalRenew);
                }

                if (checkDateBeforeNoEqual(rentalRenew.newEndDate, rentalRenew.rental.endDate)) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return of(rentalRenew);
            }),
            switchMap((rentalRenew) => {
                if (hardRemove) {
                    return from(this.rentalRenewRepository.remove(rentalRenew)).pipe(map(() => rentalRenew));
                }

                return from(this.rentalRenewRepository.softRemove(rentalRenew)).pipe(map(() => rentalRenew));
            }),
        );
    }

    remove(
        currentUser: UserAuth,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<RentalRenew | PaginatedData<RentalRenew> | RentalRenew[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Delete, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.removeProcess(id, hardRemove).pipe(
            map((rentalRenew) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Deleted', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenew,
                    status: HttpStatus.OK,
                };
            }),
        );
    }

    restoreProcess(id: string): Observable<RentalRenew> {
        return this.findOneProcess(id, {}, true).pipe(
            map((rentalRenew) => {
                if (!rentalRenew) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (!rentalRenew.deletedAt) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.RentalRenew.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return rentalRenew;
            }),
            switchMap((rentalRenew) => {
                return from(this.rentalRenewRepository.restore(rentalRenew.id)).pipe(map(() => rentalRenew));
            }),
        );
    }

    restore(
        currentUser: UserAuth,
        id: string,
    ): Observable<ApiResponse<RentalRenew | PaginatedData<RentalRenew> | RentalRenew[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Restore, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.restoreProcess(id).pipe(
            map((rentalRenew) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Restored', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenew,
                    status: HttpStatus.OK,
                };
            }),
        );
    }

    updateProcess(id: string, updateDto: UpdateRentalRenewDto): Observable<RentalRenew> | any {
        if (updateDto.rentalId) {
            throw new BadRequestException(
                this.i18nService.translate('message.RentalRenew.CannotUpdateRentalId', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.findOneProcess(id, {
            relations: { rental: true },
        }).pipe(
            switchMap((rentalRenew) => {
                if (!rentalRenew) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.RentalRenew.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (updateDto.newEndDate && !this.checkDate(rentalRenew.rental.endDate, updateDto.newEndDate)) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.RentalRenew.InvalidDate', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return from(this.rentalRenewRepository.save({ ...rentalRenew, ...updateDto }));
            }),
        );
    }

    update(currentUser: UserAuth, id: string, updateDto: UpdateRentalRenewDto): Observable<ApiResponse<RentalRenew>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Update, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.updateProcess(id, updateDto).pipe(
            map((rentalRenew) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Updated', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenew,
                    status: HttpStatus.OK,
                };
            }),
        );
    }

    findAllByRentalProcess(id: string, findAllDto: FindAllRentalRenewDto): Observable<PaginatedData<RentalRenew>> {
        const fields: Array<keyof RentalRenew> = ['id', 'rentalId'];
        const relations = ['rental', 'rental.account', 'accountPrice', 'accountPrice.rentalType'];

        const searchFields: SearchField[] = [];

        const additionalConditions: CustomCondition[] = [
            {
                field: 'rentalId',
                value: id,
                operator: 'EQUAL',
            },
        ];

        return findWithPaginationAndSearch<RentalRenew>(
            this.rentalRenewRepository,
            findAllDto,
            fields,
            true,
            relations,
            searchFields,
            additionalConditions,
        );
    }

    findAllByRental(user: UserAuth, id: string, findAllDto: FindAllRentalRenewDto) {
        const ability = this.caslAbilityFactory.createForUser(user);

        if (ability.cannot(ActionCasl.ReadAll, RentalRenew)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.findAllByRentalProcess(id, findAllDto).pipe(
            map((rentalRenews) => {
                return {
                    message: this.i18nService.translate('message.RentalRenew.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data: rentalRenews,
                    status: HttpStatus.OK,
                };
            }),
        );
    }
}
