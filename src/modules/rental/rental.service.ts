import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
    WorkspaceEmailStatus,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { AccountPriceService } from '../account-price/account-price.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CustomerService } from '../customer/customer.service';
import { EmailService } from '../email/email.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
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
            User
        >
{
    constructor(
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
        console.log('createDto', createDto);

        const {
            customerId,
            accountPriceId,
            discount,
            emailId,
            endDate,
            note,
            paymentAmount,
            paymentMethod,
            startDate,
            status,
            totalPrice,
            warrantyFee,
            workspaceId,
        } = createDto;
        const tasks: Observable<any>[] = [];
        tasks.push(
            this.customerService.findOneProcess(customerId).pipe(
                switchMap((customer) => {
                    if (!customer) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.Customer.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return this.emailService.findOneProcess(emailId);
                }),
                switchMap((email) => {
                    if (!email) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.Email.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return this.checkEmailBelongToCustomer(email.email, customerId);
                }),
            ),
        );
        tasks.push(
            this.accountPriceService.findOneProcess(accountPriceId).pipe(
                map((accountPrice) => {
                    if (!accountPrice) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.AccountPrice.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return accountPrice;
                }),
                switchMap((accountPrice) => {
                    if (createDto.workspaceId) {
                        return this.workspaceService
                            .findOneProcess(workspaceId, {
                                relations: {
                                    adminAccount: true,
                                },
                            })
                            .pipe(
                                map((workspace) => {
                                    if (!workspace) {
                                        throw new NotFoundException(
                                            this.i18nService.translate('message.Workspace.NotFound', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }
                                    this.checkAccount(accountPrice.accountId, workspace.adminAccount.accountId);
                                    return workspace;
                                }),
                                switchMap(() => {
                                    return this.workspaceEmailService.createProcessAndGetId({
                                        workspaceId: createDto.workspaceId,
                                        emailId: createDto.emailId,
                                    });
                                }),
                            );
                    }
                    return of(null);
                }),
            ),
        );

        return forkJoin(tasks).pipe(
            map(([isExist, workspaceEmailId]) => {
                isExist;
                const rental = new Rental();
                rental.customerId = customerId;
                rental.accountPriceId = accountPriceId;
                rental.discount = discount;
                rental.emailId = emailId;
                rental.endDate = endDate;
                rental.note = note;
                rental.paymentAmount = paymentAmount;
                rental.paymentMethod = paymentMethod;
                rental.startDate = startDate;
                rental.status = status;
                rental.totalPrice = totalPrice;
                rental.warrantyFee = warrantyFee;
                if (workspaceEmailId) {
                    rental.workspaceEmailId = workspaceEmailId;
                }
                return this.rentalRepository.create(rental);
            }),
            switchMap((rental) => from(this.rentalRepository.save(rental))),
        );
    }
    create(currentUser: User, createDto: CreateRentalDto): Observable<ApiResponse<Rental>> {
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

    findOneProcess(id: string, options?: FindOneOptionsCustom<Rental>): Observable<Rental> {
        return from(
            this.rentalRepository.findOne({
                where: { id },
                ...options,
            }),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Rental>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findOneProcess(id).pipe(
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
    findAllProcess(findAllDto: FindAllRentalDto): Observable<PaginatedData<Rental>> {
        const fields: Array<keyof Rental> = [
            'id',
            'status',
            'startDate',
            'endDate',
            'totalPrice',
            'discount',
            'paymentAmount',
            'paymentMethod',
            'note',
            'createdAt',
            'updatedAt',
            'deletedAt',
            'accountPriceId',
            'customerId',
            'emailId',
            'workspaceEmailId',
        ];
        const searchFields: SearchField[] = [];
        const relations: string[] = ['accountPrice', 'customer', 'email', 'workspaceEmail'];
        return findWithPaginationAndSearch<Rental>(this.rentalRepository, findAllDto, fields, searchFields, relations);
    }
    findAll(currentUser: User, findAllDto: FindAllRentalDto): Observable<ApiResponse<PaginatedData<Rental>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
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
        currentUser: User,
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
    restore(currentUser: User, id: string): Observable<ApiResponse<Rental | PaginatedData<Rental> | Rental[]>> {
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
    updateEmailWorkspaceId(rental: Rental, idEmail: string, create = false, workSpaceId?: string): Observable<string> {
        if (rental.workspaceEmailId) {
            return this.removeWorkSpaceEmailAndCreateNew(rental, {
                emailId: idEmail,
                workspaceId: workSpaceId || rental.workspaceEmail.workspaceId,
            }).pipe(
                map((workspaceEmailId) => {
                    return workspaceEmailId;
                }),
            );
        } else {
            if (create) {
                return this.workspaceEmailService.createProcessAndGetId({
                    emailId: idEmail,
                    workspaceId: workSpaceId,
                });
            }
        }
        return of(null);
    }
    updateProcess(id: string, updateDto: UpdateRentalDto): Observable<Rental> {
        const { accountPriceId, emailId, customerId, workspaceId, ...rest } = updateDto;

        const updateData: DeepPartial<Rental> = { ...rest };
        return from(
            this.findOneProcess(id, {
                relations: {
                    workspaceEmail: { workspace: { adminAccount: true } },
                    accountPrice: { account: true },
                },
            }),
        ).pipe(
            switchMap((rental) => {
                if (!rental) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (customerId && rental.customerId !== customerId) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Authentication.Forbidden', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                const checkForForkJoin: CheckForForkJoin = {};
                if (accountPriceId && rental.accountPriceId !== accountPriceId) {
                    tasks.push(
                        this.accountPriceService
                            .findOneProcess(accountPriceId, {
                                relations: {
                                    account: true,
                                    rentalType: true,
                                },
                            })
                            .pipe(
                                map((accountPrice) => {
                                    if (!accountPrice) {
                                        throw new NotFoundException(
                                            this.i18nService.translate('message.AccountPrice.NotFound', {
                                                lang: I18nContext.current().lang,
                                            }),
                                        );
                                    }
                                    checkForForkJoin.accountPrice = true;
                                    return accountPrice;
                                }),
                            ),
                    );
                } else tasks.push(of(null));
                if (emailId && rental.emailId !== emailId) {
                    tasks.push(
                        this.emailService.findOneProcess(emailId).pipe(
                            map((email) => {
                                if (!email) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.Email.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                checkForForkJoin.email = true;
                                return email;
                            }),
                        ),
                    );
                } else tasks.push(of(null));

                if ((workspaceId || workspaceId === null) && rental.workspaceEmail?.workspaceId !== workspaceId) {
                    if (workspaceId === null) {
                        checkForForkJoin.workspace = true;
                        tasks.push(of(null));
                    } else
                        tasks.push(
                            this.workspaceService
                                .findOneProcess(workspaceId, {
                                    relations: {
                                        adminAccount: true,
                                    },
                                })
                                .pipe(
                                    map((workspace) => {
                                        if (!workspace) {
                                            throw new NotFoundException(
                                                this.i18nService.translate('message.Workspace.NotFound', {
                                                    lang: I18nContext.current().lang,
                                                }),
                                            );
                                        }
                                        checkForForkJoin.workspace = true;
                                        return workspace;
                                    }),
                                ),
                        );
                } else tasks.push(of(null));

                return forkJoin(tasks).pipe(
                    switchMap(([accountPrice, email, workspace]) => {
                        email;
                        if (checkForForkJoin.accountPrice && checkForForkJoin.email && checkForForkJoin.workspace) {
                            this.checkEmailBelongToCustomer(emailId, rental.customerId);
                            if (workspaceId === null) {
                                return this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental).pipe(
                                    switchMap(() => {
                                        delete rental.workspaceEmail;
                                        delete rental.accountPrice;
                                        updateData.emailId = emailId;
                                        updateData.accountPriceId = accountPriceId;
                                        return of(updateData);
                                    }),
                                );
                            }
                            this.checkAccount(accountPrice.accountId, workspace.adminAccount.accountId);
                            return this.updateEmailWorkspaceId(rental, emailId, true, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.email;
                                    delete rental.workspaceEmail;
                                    delete rental.accountPrice;
                                    updateData.emailId = emailId;
                                    updateData.accountPriceId = accountPriceId;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    return updateData;
                                }),
                            );
                        } else if (checkForForkJoin.accountPrice && checkForForkJoin.email) {
                            this.checkEmailBelongToCustomer(emailId, rental.customerId);
                            this.checkAccount(
                                accountPrice.accountId,
                                rental.workspaceEmail.workspace.adminAccount.accountId,
                            );
                            return this.updateEmailWorkspaceId(rental, emailId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.email;
                                    delete rental.workspaceEmail;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    updateData.emailId = emailId;
                                    updateData.accountPriceId = accountPriceId;
                                    return updateData;
                                }),
                            );
                        } else if (checkForForkJoin.accountPrice && checkForForkJoin.workspace) {
                            if (workspaceId === null) {
                                return this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental).pipe(
                                    switchMap(() => {
                                        delete rental.workspaceEmail;
                                        delete rental.accountPrice;
                                        updateData.emailId = emailId;
                                        updateData.accountPriceId = accountPriceId;
                                        return of(updateData);
                                    }),
                                );
                            }
                            this.checkAccount(workspace.adminAccount.accountId, accountPrice.accountId);
                            return this.updateEmailWorkspaceId(rental, rental.emailId, true, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.workspaceEmail;
                                    delete rental.accountPrice;
                                    updateData.accountPriceId = accountPriceId;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    return updateData;
                                }),
                            );
                        } else if (checkForForkJoin.email && checkForForkJoin.workspace) {
                            this.checkEmailBelongToCustomer(emailId, rental.customerId);
                            if (workspaceId === null) {
                                return this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental).pipe(
                                    switchMap(() => {
                                        delete rental.workspaceEmail;
                                        delete rental.email;
                                        updateData.emailId = emailId;
                                        return of(updateData);
                                    }),
                                );
                            }
                            this.checkAccount(
                                workspace.adminAccount.accountId,
                                rental.workspaceEmail?.workspace.adminAccount.accountId,
                            );
                            return this.updateEmailWorkspaceId(rental, emailId, true, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.email;
                                    delete rental.workspaceEmail;
                                    updateData.emailId = emailId;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    return updateData;
                                }),
                            );
                        } else if (checkForForkJoin.accountPrice) {
                            if (rental.workspaceEmailId) {
                                this.checkAccount(
                                    accountPrice.accountId,
                                    rental.workspaceEmail.workspace.adminAccount.accountId,
                                );
                                updateData.accountPriceId = accountPriceId;
                                return of(updateData);
                            }
                            delete updateData.accountPrice;
                        } else if (checkForForkJoin.email) {
                            this.checkEmailBelongToCustomer(emailId, rental.customerId);
                            return this.updateEmailWorkspaceId(rental, emailId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.email;
                                    delete rental.workspaceEmail;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    updateData.emailId = emailId;
                                    return updateData;
                                }),
                            );
                        } else if (checkForForkJoin.workspace) {
                            if (workspaceId === null) {
                                return this.setWorkspaceEmailToNullAndRemoveWorkspaceEmail(rental).pipe(
                                    switchMap(() => {
                                        delete rental.workspaceEmail;
                                        return of(updateData);
                                    }),
                                );
                            }
                            this.checkAccount(workspace.adminAccount.accountId, rental.accountPrice.accountId);
                            return this.updateEmailWorkspaceId(rental, rental.emailId, true, workspaceId).pipe(
                                map((workspaceEmailId) => {
                                    delete rental.workspaceEmail;
                                    updateData.workspaceEmailId = workspaceEmailId;
                                    return updateData;
                                }),
                            );
                        } else return of(updateData);
                    }),
                    switchMap((updateData) => {
                        return updateEntity<Rental>(this.rentalRepository, rental, updateData);
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
        currentUser: User,
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
                    workspaceEmail: true,
                    customer: true,
                    accountPrice: { account: true },
                },
            }),
        ).pipe(
            map((rentals) => {
                const checks: {
                    rental: Rental[];
                    workspaceEmail: WorkspaceEmail[];
                    rentalNearExpired: Rental[];
                } = {
                    rental: [],
                    workspaceEmail: [],
                    rentalNearExpired: [],
                };
                rentals.map((rental) => {
                    const {
                        rental: rentalUpdate,
                        workspaceEmail,
                        nearExpired,
                    } = this.checkExpiredAndUpdateStatus(rental);
                    checks.rental.push(rentalUpdate);
                    if (workspaceEmail) {
                        checks.workspaceEmail.push(workspaceEmail);
                    }
                    if (nearExpired) {
                        checks.rentalNearExpired.push(rentalUpdate);
                    }
                });
                return forkJoin([
                    this.saveAll(checks.rental),
                    this.workspaceEmailService.saveAll(checks.workspaceEmail),
                    this.sendMailWithForJoin(checks.rentalNearExpired),
                    this.pingToAdminBot(checks.rentalNearExpired[0]),
                ]);
            }),
            map(() => {
                return 'success';
            }),
        );
    }
    sendMailExpired(rental: Rental) {
        return from(
            this.mailService
                .sendMailWarningNearExpired(rental.customer.email, {
                    name: rental.customer.name,
                    email: rental.customer.email,
                    accountName: rental.accountPrice.account.name,
                    expiredAt: rental.endDate,
                    daysLeft: this.configService.get<number>('RENTAL_NEAR_EXPIRED_DAYS'),
                })
                .pipe(
                    map(() => {
                        console.log('send mail success');
                        return rental;
                    }),
                ),
        );
    }
    sendMailWithForJoin(rentals: Rental[]) {
        const tasks: Observable<any>[] = [];
        rentals.map((rental) => {
            return tasks.push(this.sendMailExpired(rental));
        });
        return forkJoin(tasks);
    }

    pingToAdminBot(rental: Rental) {
        const markDown = `
        *Rental ${rental.id} is expired*
        *Customer*: ${rental.customer.name}
        *Account*: ${rental.accountPrice.account.name}
        *Expired at*: ${rental.endDate}
        `;
        return from(
            this.bot.telegram.sendMessage(this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID'), markDown, {
                parse_mode: 'Markdown',
            }),
        );
    }
    @Cron(CronExpression.EVERY_MINUTE)
    handleCron() {
        this.checkExpiredAll().subscribe((result) => {
            console.log('result', result);
        });
    }
}
