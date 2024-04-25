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
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
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
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { User } from '../user/entities/user.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
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
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    checkExitsByEmail(email: string): Observable<boolean> {
        return from(
            this.customerRepository.existsBy({
                email,
            }),
        );
    }
    createProcess(createDto: CreateCustomerDto): Observable<Customer> {
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
                const customer = this.customerRepository.create(newCustomer);
                return from(this.customerRepository.save(customer));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateCustomerDto): Observable<ApiResponse<Customer>> {
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
    findOneProcess(id: string, options?: FindOneOptionsCustom<Customer>): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id }, ...options })).pipe(
            map((customer) => {
                if (!customer) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return customer;
            }),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, Customer)) {
            throw new ForbiddenException('You are not allowed to read customer');
        }
        return this.findOneProcess(id).pipe(
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
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Customer>> {
        const relations = [];
        const searchFields: SearchField[] = [];
        const fields: Array<keyof Customer> = ['id', 'name', 'email', 'phone', 'address', 'company', 'description'];
        return findWithPaginationAndSearch<Customer>(
            this.customerRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
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
    removeProcess(id: string, hardRemove?: boolean): Observable<Customer> {
        return from(
            this.customerRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    emails: !hardRemove,
                },
            }),
        ).pipe(
            switchMap((customer) => {
                if (hardRemove) {
                    if (!customer.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Customer.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }

                    return from(this.customerRepository.remove(customer));
                }
                if (customer.emails) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Customer.NotDeleted', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.customerRepository.softRemove(customer));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Customer.Deleted', {
                    lang: I18nContext.current().lang,
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

                return from(this.customerRepository.restore(customer)).pipe(map(() => customer));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Restore, Customer)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: this.i18nService.translate('message.Customer.Restored', {
                    lang: I18nContext.current().lang,
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
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateCustomerDto,
    ): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
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
}
