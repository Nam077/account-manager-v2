import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
    UserAuth,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { EmailService } from '../email/email.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { FindAllCustomerDto } from './dto/find-all.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerService
    implements
        CrudService<
            ApiResponse<Customer | Customer[] | PaginatedData<Customer>>,
            Customer,
            PaginatedData<Customer>,
            CreateCustomerDto,
            UpdateCustomerDto,
            FindAllCustomerDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
        @Inject(forwardRef(() => EmailService))
        private readonly emailService: EmailService,
    ) {}

    public checkExitsByEmail(email: string): Observable<boolean> {
        return from(
            this.customerRepository.existsBy({
                email,
            }),
        );
    }

    public createProcess(createDto: CreateCustomerDto): Observable<Customer> {
        const { name, email, address, company, description, phone } = createDto;

        return from(this.checkExitsByEmail(email)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.Customer.Conflict', {
                            args: { name: email },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const newCustomer = new Customer();

                newCustomer.name = name;
                newCustomer.email = email;
                newCustomer.address = address;
                newCustomer.company = company;
                newCustomer.description = description;
                newCustomer.phone = phone;

                return of(this.customerRepository.create(newCustomer));
            }),
            switchMap((customer) => from(this.customerRepository.save(customer))),
            switchMap((customer) =>
                this.emailService
                    .createProcess({ email: customer.email, customerId: customer.id })
                    .pipe(map(() => customer)),
            ),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    public create(currentUser: UserAuth, createDto: CreateCustomerDto): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.Create, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<Customer> => ({
                    status: HttpStatus.CREATED,
                    message: this.i18nService.translate('message.Customer.Created', {
                        args: { name: data.name },
                        lang: I18nContext.current().lang,
                    }),
                    data,
                }),
            ),
        );
    }

    public findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<Customer>,
        isWithDeleted?: boolean,
    ): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id }, ...options, withDeleted: isWithDeleted }));
    }

    public findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.Read, Customer)) {
            throw new ForbiddenException('You are not allowed to read customer');
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Customer);

        return this.findOneProcess(id, {}, isCanReadWithDeleted).pipe(
            map((customer) => {
                if (!customer) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return {
                    status: HttpStatus.OK,
                    data: customer,
                    message: this.i18nService.translate('message.Customer.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    public findAllProcess(
        findAllDto: FindAllCustomerDto,
        isWithDeleted?: boolean,
    ): Observable<PaginatedData<Customer>> {
        const relations = [];
        const searchFields: SearchField[] = [];
        const fields: Array<keyof Customer> = ['id', 'name', 'email', 'phone', 'address', 'company', 'description'];

        return findWithPaginationAndSearch<Customer>(
            this.customerRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }

    public findAll(
        currentUser: UserAuth,
        findAllDto: FindAllCustomerDto,
    ): Observable<ApiResponse<PaginatedData<Customer>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.ReadAll, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Customer);

        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map(
                (data): ApiResponse<PaginatedData<Customer>> => ({
                    status: HttpStatus.OK,
                    data,
                    message: this.i18nService.translate('message.Customer.Found', {
                        lang: I18nContext.current().lang,
                    }),
                }),
            ),
        );
    }

    public removeProcess(id: string, hardRemove?: boolean): Observable<Customer> {
        return from(
            this.customerRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    emails: !hardRemove,
                    rentals: !hardRemove,
                },
            }),
        ).pipe(
            switchMap((customer) => {
                if (hardRemove) {
                    if (!customer.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Customer.NotDeleted', {
                                lang: I18nContext.current().lang,
                                args: { name: customer.name },
                            }),
                        );
                    }

                    return this.emailService
                        .removeByCustomerIdProcess(customer.id, true)
                        .pipe(
                            switchMap(() => from(this.customerRepository.remove(customer)).pipe(map(() => customer))),
                        );
                }

                if (customer.rentals && customer.rentals.length > 0) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Customer.NotDeleted', {
                            lang: I18nContext.current().lang,
                            args: { name: customer.name },
                        }),
                    );
                }

                return this.emailService
                    .removeByCustomerIdProcess(customer.id)
                    .pipe(
                        switchMap(() => from(this.customerRepository.softRemove(customer)).pipe(map(() => customer))),
                    );
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    remove(currentUser: UserAuth, id: string, hardRemove?: boolean): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.Delete, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.removeProcess(id, hardRemove).pipe(
            map((customer) => ({
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Customer.Deleted', {
                    lang: I18nContext.current().lang,
                    args: { name: customer.name },
                }),
            })),
        );
    }

    restoreProcess(id: string): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (!customer.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Customer.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return from(this.customerRepository.restore(customer.id)).pipe(
                    switchMap(() => {
                        return this.emailService.restoreByCustomerIdProcess(customer.id).pipe(map(() => customer));
                    }),
                );
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.Restore, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.restoreProcess(id).pipe(
            map((customer) => ({
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Customer.Restored', {
                    lang: I18nContext.current().lang,
                    args: { name: customer.name },
                }),
            })),
        );
    }

    updateProcess(id: string, updateDto: UpdateCustomerDto): Observable<Customer> {
        const updateData: DeepPartial<Customer> = { ...updateDto };

        return from(this.findOneProcess(id)).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                if (updateDto.email && updateDto.email !== customer.email) {
                    return from(this.checkExitsByEmail(updateDto.email)).pipe(
                        switchMap((isExist) => {
                            if (isExist) {
                                throw new ConflictException(
                                    this.i18nService.translate('message.Customer.Conflict', {
                                        lang: I18nContext.current().lang,
                                    }),
                                );
                            }

                            return of(customer);
                        }),
                    );
                } else return of(customer);
            }),
            switchMap((customer) => {
                return updateEntity<Customer>(this.customerRepository, customer, updateData);
            }),
        );
    }

    update(currentUser: UserAuth, id: string, updateDto: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);

        if (!ability.can(ActionCasl.Update, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.updateProcess(id, updateDto).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Customer.Updated', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    findOneByEmail(email: string): Observable<Customer> {
        return from(
            this.customerRepository.findOne({
                where: { email },
            }),
        );
    }

    findEmails(user: UserAuth, id: string) {
        const ability = this.caslAbilityFactory.createForUser(user);

        if (!ability.can(ActionCasl.Read, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }

        return this.findEmailsProcess(id).pipe(
            map((data) => ({
                status: HttpStatus.OK,
                data: data.emails,
                message: this.i18nService.translate('message.Customer.Found', {
                    lang: I18nContext.current().lang,
                }),
            })),
        );
    }

    findEmailsProcess(id: string): Observable<Customer> {
        return from(
            this.customerRepository.findOne({
                where: { id },
                relations: {
                    emails: true,
                },
            }),
        );
    }
}
