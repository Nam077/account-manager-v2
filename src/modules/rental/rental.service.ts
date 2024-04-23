import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CheckForForkJoin,
    CrudService,
    FindAllDto,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
    WorkspaceEmailStatus,
} from '../../common';
import { AccountPriceService } from '../account-price/account-price.service';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CustomerService } from '../customer/customer.service';
import { EmailService } from '../email/email.service';
import { User } from '../user/entities/user.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { WorkspaceEmailService } from '../workspace-email/workspace-email.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Rental } from './entities/rental.entity';

@Injectable()
export class RentalService
    implements
        CrudService<
            ApiResponse<Rental | Rental[] | PaginatedData<Rental>>,
            Rental,
            PaginatedData<Rental>,
            CreateRentalDto,
            UpdateRentalDto,
            FindAllDto,
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
    ) {}
    checkAccount(accountId: string, accountId2: string) {
        if (!accountId2) return;
        if (accountId !== accountId2) {
            throw new BadRequestException('Account does not belong to account price');
        }
    }
    checkEmailBelongToCustomer(email: string, customerId: string): Observable<boolean> {
        return this.emailService.checkExistByEmailAndCustomerId(email, customerId).pipe(
            tap((isExist) => {
                if (!isExist) {
                    throw new BadRequestException('Email not found or not belong to customer');
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
            this.customerService.findOneData(customerId).pipe(
                switchMap((customer) => {
                    if (!customer) {
                        throw new NotFoundException('Customer not found');
                    }
                    return this.emailService.findOneData(emailId);
                }),
                switchMap((email) => {
                    if (!email) {
                        throw new NotFoundException('Email not found');
                    }
                    return this.checkEmailBelongToCustomer(email.email, customerId);
                }),
            ),
        );
        tasks.push(
            this.accountPriceService.findOneData(accountPriceId).pipe(
                map((accountPrice) => {
                    if (!accountPrice) {
                        throw new NotFoundException('Account price not found');
                    }
                    return accountPrice;
                }),
                switchMap((accountPrice) => {
                    if (createDto.workspaceId) {
                        return this.workspaceService.findOneWithAdminAccount(workspaceId).pipe(
                            map((workspace) => {
                                if (!workspace) {
                                    throw new NotFoundException('Workspace not found');
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
            throw new ForbiddenException('You are not allowed to create rental');
        }
        return this.createProcess(createDto).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.CREATED,
                    data: rental,
                    message: 'Rental created successfully',
                };
            }),
        );
    }
    findOneData(id: string): Observable<Rental> {
        return from(
            this.rentalRepository.findOne({
                where: { id },
                relations: {
                    workspaceEmail: { workspace: { adminAccount: true } },
                    accountPrice: { account: true },
                },
            }),
        );
    }
    findOneProcess(id: string): Observable<Rental> {
        return from(
            this.rentalRepository.findOne({
                where: { id },
            }),
        ).pipe(
            map((rental) => {
                if (!rental) {
                    throw new NotFoundException('Rental not found');
                }
                return rental;
            }),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Rental>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException('You are not allowed to read rental');
        }
        return this.findOneProcess(id).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.OK,
                    data: rental,
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Rental>> {
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
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<Rental>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, Rental)) {
            throw new ForbiddenException('You are not allowed to read rental');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((rentals) => {
                return {
                    status: HttpStatus.OK,
                    data: rentals,
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
                    throw new NotFoundException('Rental not found');
                }
                return rental;
            }),
            switchMap((rental) => {
                if (hardRemove) {
                    if (!rental.deletedAt) {
                        throw new BadRequestException('Rental is not soft deleted');
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
            throw new ForbiddenException('You are not allowed to delete rental');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.OK,
                    data: rental,
                    message: 'Rental deleted successfully',
                };
            }),
        );
    }
    restoreProcess(id: string): Observable<Rental> {
        return from(this.rentalRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            map((rental) => {
                if (!rental) {
                    throw new NotFoundException('Rental not found');
                }
                return rental;
            }),
            switchMap((rental) => {
                if (!rental.deletedAt) {
                    throw new BadRequestException('Rental is not soft deleted');
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
            throw new ForbiddenException('You are not allowed to restore rental');
        }
        return this.restoreProcess(id).pipe(
            map((rental) => {
                return {
                    status: HttpStatus.OK,
                    data: rental,
                    message: 'Rental restored successfully',
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
        if (customerId) {
            throw new BadRequestException('Customer id cannot be updated');
        }
        const updateData: DeepPartial<Rental> = { ...rest };
        return from(this.findOneData(id)).pipe(
            switchMap((rental) => {
                if (!rental) {
                    throw new NotFoundException('Rental not found');
                }
                const tasks: Observable<any>[] = [];
                const checkForForkJoin: CheckForForkJoin = {};
                if (accountPriceId && rental.accountPriceId !== accountPriceId) {
                    tasks.push(
                        this.accountPriceService.findOneData(accountPriceId).pipe(
                            map((accountPrice) => {
                                if (!accountPrice) {
                                    throw new NotFoundException('Account price not found');
                                }
                                checkForForkJoin.accountPrice = true;
                                return accountPrice;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (emailId && rental.emailId !== emailId) {
                    tasks.push(
                        this.emailService.findOneData(emailId).pipe(
                            map((email) => {
                                if (!email) {
                                    throw new NotFoundException('Email not found');
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
                            this.workspaceService.findOneData(workspaceId).pipe(
                                map((workspace) => {
                                    if (!workspace) {
                                        throw new NotFoundException('Workspace not found');
                                    }
                                    checkForForkJoin.workspace = true;
                                    return workspace;
                                }),
                            ),
                        );
                } else tasks.push(of(null));

                return forkJoin(tasks).pipe(
                    switchMap(([accountPrice, email, workspace]) => {
                        console.log(checkForForkJoin);

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
                    throw new NotFoundException('Rental not found');
                }
                return true;
            }),
        );
    }
    removeWorkspaceEmail(rental: Rental): Observable<boolean> {
        if (rental.workspaceEmailId) {
            return this.workspaceEmailService.removeNoCheckRealtion(rental.workspaceEmailId).pipe(
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
            throw new ForbiddenException('You are not allowed to update rental');
        }

        return this.updateProcess(id, updateDto);
    }
}
