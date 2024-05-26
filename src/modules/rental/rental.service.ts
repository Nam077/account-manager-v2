import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectBot } from 'nestjs-telegraf';
import { forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { Scenes, Telegraf } from 'telegraf';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    checkDate,
    checkDaysDifference,
    CheckForForkJoin,
    CrudService,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    RentalStatus,
    SearchField,
    updateEntity,
    UserAuth,
    WorkspaceEmailStatus,
    WorkspaceTypeEnums,
} from '../../common';
import { RentalTypeEnums } from '../../common/enum/rental-type.enum';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountPriceService } from '../account-price/account-price.service';
import { AccountPrice } from '../account-price/entities/account-price.entity';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../customer/entities/customer.entity';
import { EmailService } from '../email/email.service';
import { Email } from '../email/entities/email.entity';
import { MailService } from '../mail/mail.service';
import { RentalRenewService } from '../rental-renew/rental-renew.service';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { WorkspaceEmail } from '../workspace-email/entities/workspace-email.entity';
import { WorkspaceEmailService } from '../workspace-email/workspace-email.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { FindAllRentalDto } from './dto/find-all.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Rental } from './entities/rental.entity';

export interface TelegrafContext extends Scenes.SceneContext {}

@Injectable()
export class RentalService
    implements
        CrudService<
            ApiResponse<Rental | Rental[] | PaginatedData<Rental>>,
            Rental,
            PaginatedData<Rental>,
            CreateRentalDto,
            UpdateRentalDto,
            FindAllRentalDto,
            UserAuth
        >
{
    constructor(
        @Inject(forwardRef(() => RentalRenewService))
        private readonly rentalRenewService: RentalRenewService,
        @InjectRepository(Rental)
        private readonly rentalRepository: Repository<Rental>,
        private readonly workspaceService: WorkspaceService,
        private readonly customerService: CustomerService,
        private readonly accountPriceService: AccountPriceService,
        private readonly emailService: EmailService,
        private readonly workspaceEmailService: WorkspaceEmailService,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        @InjectBot() private bot: Telegraf<TelegrafContext>,
    ) {}

    checkAccount(accountId: string, accountId2: string) {
        if (!accountId2) return;

        if (accountId !== accountId2) {
            throw new BadRequestException(
                this.i18nService.translate('message.Workspace.NotBelongToAccount', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
    }

    checkEmailBelongToCustomer(email: string, customerId: string): Observable<boolean> {
        return this.emailService.checkExistByEmailAndCustomerId(email, customerId).pipe(
            tap((isExist) => {
                if (!isExist) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotBelongToCustomer', {
                            args: { name: email, customer: customerId },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return isExist;
            }),
        );
    }

    createProcess(createDto: CreateRentalDto): Observable<Rental> {
        const {
            customerId,
            accountPriceId,
            discount,
            emailId,
            note,
            startDate,
            status,
            workspaceId,
            warrantyFee,
            paymentMethod,
        } = createDto;

        const recordContext: {
            customer: Customer;
            email: Email;
            accountPrice: AccountPrice;
            workspace: Workspace;
            workspaceEmailId: string;
            isCreateWorkspaceEmail: boolean;
        } = {
            customer: null,
            email: null,
            accountPrice: null,
            workspace: null,
            workspaceEmailId: null,
            isCreateWorkspaceEmail: false,
        };

        return this.customerService.findOneProcess(customerId).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                recordContext.customer = customer;

                return this.emailService.findOneProcess(emailId);
            }),
            switchMap((email) => {
                if (!email) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (email.customerId !== recordContext.customer.id) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotBelongToCustomer', {
                            args: { name: email.email, customer: customerId },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                recordContext.email = email;

                return this.accountPriceService.findOneProcess(accountPriceId, {
                    relations: {
                        rentalType: true,
                    },
                });
            }),
            switchMap((accountPrice) => {
                if (!accountPrice) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.AccountPrice.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                recordContext.accountPrice = accountPrice;

                if (accountPrice.rentalType.type === RentalTypeEnums.PERSONAL) {
                    if (workspaceId) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Rental.WorkspaceNotAllowed', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    return of(null);
                } else {
                    if (!workspaceId) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Rental.WorkspaceRequired', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    recordContext.isCreateWorkspaceEmail = true;

                    return this.workspaceService.findOneProcess(workspaceId, {
                        relations: {
                            adminAccount: true,
                        },
                    });
                }
            }),
            switchMap((workspace) => {
                if (recordContext.isCreateWorkspaceEmail && !workspace) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Workspace.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (recordContext.isCreateWorkspaceEmail) {
                    if (recordContext.accountPrice.rentalType.type === RentalTypeEnums.BUSINESS) {
                        if (workspace.type !== WorkspaceTypeEnums.BUSINESS) {
                            throw new BadRequestException(
                                this.i18nService.translate('message.Rental.WorkspaceTypeNotMatch', {
                                    lang: I18nContext.current().lang,
                                }),
                            );
                        }
                    }

                    if (recordContext.accountPrice.rentalType.type === RentalTypeEnums.SHARED) {
                        if (workspace.type !== WorkspaceTypeEnums.SHARED) {
                            throw new BadRequestException(
                                this.i18nService.translate('message.Rental.WorkspaceTypeNotMatch', {
                                    lang: I18nContext.current().lang,
                                }),
                            );
                        }
                    }

                    recordContext.workspace = workspace;

                    return this.workspaceEmailService.createProcessAndGetId({
                        emailId,
                        workspaceId,
                    });
                }

                return of(null);
            }),
            switchMap((workspaceEmailId) => {
                recordContext.workspaceEmailId = workspaceEmailId;
                const rental = new Rental();

                rental.customerId = recordContext.customer.id;
                rental.accountId = recordContext.accountPrice.accountId;
                rental.emailId = recordContext.email.id;
                rental.startDate = startDate;
                rental.endDate = new Date(startDate);
                rental.status = status;
                rental.note = note;
                rental.workspaceEmailId = workspaceEmailId;

                return from(this.rentalRepository.save(rental));
            }),
            switchMap((rental) => {
                return this.rentalRenewService
                    .createProcess({
                        accountPriceId: accountPriceId,
                        rentalId: rental.id,
                        discount: discount,
                        paymentMethod: paymentMethod,
                        warrantyFee: warrantyFee,
                        note: note,
                    })
                    .pipe(map(() => rental));
            }),
        );
    }

    create(currentUser: UserAuth, createDto: CreateRentalDto): Observable<ApiResponse<Rental>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Create, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.createProcess(createDto).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.CREATED,
                    data: rental,
                    message: this.i18nService.translate('message.Rental.Created', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    findOneProcess(id: string, options?: FindOneOptionsCustom<Rental>, isWithDeleted?: boolean): Observable<Rental> {
        return from(
            this.rentalRepository.findOne({
                where: { id },
                ...options,
                withDeleted: isWithDeleted,
            }),
        );
    }

    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<Rental>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Rental);

        return this.findOneProcess(
            id,
            {
                relations: {
                    account: true,
                    workspaceEmail: true,
                    customer: true,
                    email: true,
                },
            },
            isCanReadWithDeleted,
        ).pipe(
            map((rental) => {
                if (!rental) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return {
                    status: HttpStatus.OK,
                    data: rental,
                    message: this.i18nService.translate('message.Rental.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    findAllProcess(findAllDto: FindAllRentalDto, isWithDeleted?: boolean): Observable<PaginatedData<Rental>> {
        const fields: Array<keyof Rental> = [
            'id',
            'status',
            'startDate',
            'endDate',
            'note',
            'createdAt',
            'updatedAt',
            'deletedAt',
            'emailId',
            'workspaceEmailId',
        ];

        const searchFields: SearchField[] = [
            {
                tableName: 'customer',
                fields: ['name', 'email'],
            },
            {
                tableName: 'account',
                fields: ['name'],
            },
            {
                tableName: 'email',
                fields: ['email'],
            },
        ];

        const relations: string[] = ['account', 'customer', 'email', 'workspaceEmail'];

        return findWithPaginationAndSearch<Rental>(
            this.rentalRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }

    findAll(currentUser: UserAuth, findAllDto: FindAllRentalDto): Observable<ApiResponse<PaginatedData<Rental>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Rental);

        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((rentals) => {
                return {
                    status: HttpStatus.OK,
                    data: rentals,
                    message: this.i18nService.translate('message.Rental.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental: Rental) {
        if (rental.workspaceEmailId) {
            return this.updateWorkSpaceEmailToNull(rental.id).pipe(
                switchMap((isDelete) => {
                    if (isDelete) {
                        return this.removeWorkspaceEmail(rental);
                    }

                    return of(false);
                }),
            );
        }

        return of(true);
    }

    removeProcess(id: string, hardRemove?: boolean): Observable<Rental> {
        return from(this.rentalRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            map((rental) => {
                if (!rental) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return rental;
            }),
            switchMap((rental) => {
                if (hardRemove) {
                    if (!rental.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Rental.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    if (rental.workspaceEmailId) {
                        this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental);
                    }

                    return from(this.rentalRepository.remove(rental)).pipe(map(() => rental));
                }

                return from(this.rentalRepository.softRemove(rental)).pipe(map(() => rental));
            }),
        );
    }

    remove(
        currentUser: UserAuth,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Rental | PaginatedData<Rental> | Rental[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Delete, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.removeProcess(id, hardRemove).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.OK,
                    data: rental,
                    message: this.i18nService.translate('message.Rental.Deleted', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    restoreProcess(id: string): Observable<Rental> {
        return from(this.rentalRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            map((rental) => {
                if (!rental) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return rental;
            }),
            switchMap((rental) => {
                if (!rental.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Rental.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (rental.workspaceEmailId) {
                    return from(
                        this.workspaceEmailService.updateStatusProcess(
                            rental.workspaceEmailId,
                            WorkspaceEmailStatus.ACTIVE,
                        ),
                    ).pipe(map(() => rental));
                }

                return of(rental);
            }),
            switchMap((rental) =>
                from(
                    this.rentalRepository.restore({
                        id,
                    }),
                ).pipe(map(() => rental)),
            ),
        );
    }

    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<Rental | PaginatedData<Rental> | Rental[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Restore, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.restoreProcess(id).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.OK,
                    data: rental,
                    message: this.i18nService.translate('message.Rental.Restored', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    removeWorkSpaceEmailAndCreateNew(
        rental: Rental,
        updateDto: {
            emailId: string;
            workspaceId: string;
        },
    ): Observable<string> {
        return this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental).pipe(
            switchMap(() => {
                return this.workspaceEmailService.createProcessAndGetId({
                    emailId: updateDto.emailId,
                    workspaceId: updateDto.workspaceId,
                });
            }),
        );
    }

    updateEmailWorkspaceId(rental: Rental, idEmail: string, workSpaceId?: string): Observable<string> {
        if (rental.workspaceEmailId) {
            return this.removeWorkSpaceEmailAndCreateNew(rental, {
                emailId: idEmail,
                workspaceId: workSpaceId || rental.workspaceEmail.workspaceId,
            }).pipe(
                map((workspaceEmailId) => {
                    return workspaceEmailId;
                }),
            );
        }

        return of(null);
    }

    updateProcess(id: string, updateDto: UpdateRentalDto): Observable<Rental> {
        const { emailId, workspaceId, ...rest } = updateDto;
        const updateData: DeepPartial<Rental> = { ...rest };

        return this.findOneProcess(id, {
            relations: {
                account: true,
                workspaceEmail: true,
            },
        }).pipe(
            switchMap((rental) => {
                if (!rental) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const checkForForkJoin: CheckForForkJoin = {};
                const tasks: Observable<any>[] = [];

                if (emailId && emailId !== rental.emailId) {
                    tasks.push(
                        this.emailService.findOneProcess(emailId).pipe(
                            tap((email) => {
                                if (!email) {
                                    throw new BadRequestException(
                                        this.i18nService.translate('message.Email.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }

                                checkForForkJoin.email = email;
                            }),
                        ),
                    );
                } else {
                    tasks.push(of(null));
                }

                if (workspaceId && workspaceId !== rental.workspaceEmail?.workspaceId && rental.workspaceEmailId) {
                    tasks.push(
                        this.workspaceService
                            .findOneProcess(workspaceId, {
                                relations: {
                                    adminAccount: true,
                                },
                            })
                            .pipe(
                                tap((workspace) => {
                                    if (!workspace) {
                                        throw new BadRequestException(
                                            this.i18nService.translate('message.Workspace.NotFound', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }

                                    this.checkAccount(rental.accountId, workspace.adminAccount.accountId);
                                }),
                            ),
                    );
                } else {
                    tasks.push(of(null));
                }

                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        if (checkForForkJoin.email && checkForForkJoin.workspace) {
                            return this.updateEmailWorkspaceId(rental, emailId, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.workspaceEmail;
                                    delete rental.email;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                }),
                            );
                        } else if (checkForForkJoin.email) {
                            return this.updateEmailWorkspaceId(rental, emailId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.email;
                                    delete rental.workspaceEmail;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                }),
                            );
                        } else if (checkForForkJoin.workspace) {
                            return this.updateEmailWorkspaceId(rental, rental.emailId, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.workspaceEmail;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                }),
                            );
                        }

                        return of(null);
                    }),
                    switchMap(() => {
                        return updateEntity<Rental>(this.rentalRepository, rental, updateData).pipe(
                            switchMap((updatedRental) => {
                                if (updateData.status) {
                                    if (rental.workspaceEmailId) {
                                        let status: WorkspaceEmailStatus;

                                        if (updateData.status === RentalStatus.ACTIVE) {
                                            status = WorkspaceEmailStatus.ACTIVE;
                                        } else if (updateData.status === RentalStatus.INACTIVE) {
                                            status = WorkspaceEmailStatus.INACTIVE;
                                        } else {
                                            status = WorkspaceEmailStatus.EXPIRED;
                                        }

                                        return this.workspaceEmailService
                                            .updateStatusProcess(rental.workspaceEmailId, status)
                                            .pipe(map(() => updatedRental));
                                    }
                                }

                                return of(updatedRental);
                            }),
                        );
                    }),
                );
            }),
        );
    }

    updateWorkSpaceEmailToNull(id: string): Observable<boolean> {
        return from(
            this.rentalRepository.update(
                {
                    id,
                },
                {
                    workspaceEmailId: null,
                },
            ),
        ).pipe(
            map((result) => {
                if (result.affected === 0) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return true;
            }),
        );
    }

    removeWorkspaceEmail(rental: Rental): Observable<boolean> {
        if (rental.workspaceEmailId) {
            return this.workspaceEmailService.removeProcess(rental.workspaceEmailId).pipe(
                map(() => {
                    return true;
                }),
            );
        }

        return of(true);
    }

    update(
        currentUser: UserAuth,
        id: string,
        updateDto: UpdateRentalDto,
    ): Observable<ApiResponse<Rental | PaginatedData<Rental> | Rental[]>> | any {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (ability.cannot(ActionCasl.Update, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.updateProcess(id, updateDto);
    }

    checkExpiredAndUpdateStatus(rental: Rental): {
        rental: Rental;
        workspaceEmail: WorkspaceEmail;
        nearExpired: boolean;
    } {
        if (checkDate(rental.endDate)) {
            rental.status = RentalStatus.EXPIRED;

            if (rental.workspaceEmail) {
                rental.workspaceEmail.status = WorkspaceEmailStatus.EXPIRED;
            }
        }

        let nearExpired = false;

        if (checkDaysDifference(rental.endDate, this.configService.get<number>('RENTAL_NEAR_EXPIRED_DAYS'))) {
            nearExpired = true;
        }

        return {
            rental,
            workspaceEmail: rental.workspaceEmail,
            nearExpired,
        };
    }

    saveAll(rentals: Rental[]): Observable<Rental[]> {
        return from(this.rentalRepository.save(rentals));
    }

    checkExpiredAll() {
        return from(
            this.rentalRepository.find({
                where: {
                    status: RentalStatus.ACTIVE,
                },
                relations: {
                    workspaceEmail: {
                        workspace: {
                            adminAccount: {
                                account: true,
                            },
                        },
                    },
                    customer: true,
                    account: true,
                },
            }),
        ).pipe(
            map((rentals) => {
                const checks: {
                    rentalExpired: Rental[];
                    workspaceEmail: WorkspaceEmail[];
                    rentalNearExpired: Rental[];
                } = {
                    rentalExpired: [],
                    workspaceEmail: [],
                    rentalNearExpired: [],
                };

                rentals.map((rentalCheck) => {
                    const { rental, workspaceEmail, nearExpired } = this.checkExpiredAndUpdateStatus(rentalCheck);

                    if (workspaceEmail) {
                        checks.workspaceEmail.push(workspaceEmail);
                    }

                    if (nearExpired) {
                        checks.rentalNearExpired.push(rental);
                    } else {
                        checks.rentalExpired.push(rental);
                    }
                });

                return forkJoin([
                    this.saveAll(checks.rentalExpired),
                    this.workspaceEmailService.saveAll(checks.workspaceEmail),
                    this.sendMailExpiredWithForJoin(checks.rentalExpired),
                    this.sendMailWarningNearExpiredMany(checks.rentalNearExpired),
                    this.pingToAdminBotMany(checks.rentalNearExpired, true),
                    this.pingToAdminBotMany(checks.rentalExpired),
                ]);
            }),
            map(() => {
                return 'success';
            }),
        );
    }

    sendMailWarningNearExpired(rental: Rental) {
        return from(
            this.mailService
                .sendMailWarningNearExpired(rental.customer.email, {
                    name: rental.customer.name,
                    email: rental.customer.email,
                    accountName: rental.account.name,
                    expiredAt: rental.endDate,
                    daysLeft: this.configService.get<number>('RENTAL_NEAR_EXPIRED_DAYS'),
                })
                .pipe(
                    map(() => {
                        return rental;
                    }),
                ),
        );
    }

    sendMailExpired(rental: Rental) {
        return from(
            this.mailService
                .sendMailExpired(rental.customer.email, {
                    name: rental.customer.name,
                    email: rental.customer.email,
                    accountName: rental.account.name,
                    expirationDate: rental.endDate,
                })
                .pipe(
                    map(() => {
                        return rental;
                    }),
                ),
        );
    }

    sendMailExpiredWithForJoin(rentals: Rental[]) {
        const tasks: Observable<any>[] = [];

        rentals.map((rental) => {
            return tasks.push(this.sendMailExpired(rental));
        });

        return forkJoin(tasks);
    }

    sendMailWarningNearExpiredMany(rentals: Rental[]) {
        const tasks: Observable<any>[] = [];

        rentals.map((rental) => {
            return tasks.push(this.sendMailWarningNearExpired(rental));
        });

        return forkJoin(tasks);
    }

    pingToAdminBotMany(rentals: Rental[], nearExpired = false) {
        const tasks: Observable<any>[] = [];

        rentals.map((rental) => {
            return tasks.push(this.pingToAdminBot(rental, nearExpired));
        });

        return forkJoin(tasks);
    }

    pingToAdminBot(rental: Rental, nearExpired = false) {
        const markDown =
            '<b>📄 Thông Tin Thuê Tài Khoản</b>\n' +
            '- Trạng thái thuê: ' +
            (nearExpired ? '<b>🔔 Sắp hết hạn</b>' : '<b>⏳ Đã hết hạn</b>') +
            '\n' +
            '- Tên khách hàng: <b>' +
            rental.customer.name +
            '</b>\n' +
            '- Tên tài khoản: <b>' +
            rental.account.name +
            '</b>\n' +
            '- Email khách hàng: <b>' +
            rental.customer.email +
            '</b>\n' +
            '- Ngày hết hạn thuê: <b>' +
            rental.endDate +
            '</b>\n' +
            (nearExpired
                ? '- Số ngày còn lại: <b>' + this.configService.get('RENTAL_NEAR_EXPIRED_DAYS') + ' ngày</b>\n'
                : '') +
            (rental.workspaceEmail
                ? '- Thông tin workspace: <b>' +
                  rental.workspaceEmail.workspace.adminAccount.email +
                  ' - ' +
                  rental.workspaceEmail.workspace.adminAccount.account.name +
                  '</b>\n'
                : '');

        return from(
            this.bot.telegram.sendMessage(this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID'), markDown, {
                parse_mode: 'HTML',
            }),
        );
    }

    @Cron(CronExpression.EVERY_DAY_AT_7AM)
    handleCron() {
        this.checkExpiredAll().subscribe((result) => {
            console.log('result', result);
        });
    }
}
