import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    CrudService,
    FindAllDto,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
} from '../../common';
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
                    throw new ConflictException('Email already exists');
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
            throw new ForbiddenException('You are not allowed to create customer');
        }
        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<Customer> => ({
                    status: HttpStatus.CREATED,
                    message: 'Customer created successfully',
                    data,
                }),
            ),
        );
    }
    findOneData(id: string): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id } })).pipe(
            map((customer) => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
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
            map(
                (data): ApiResponse<Customer> => ({
                    status: HttpStatus.OK,
                    data,
                }),
            ),
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
            throw new ForbiddenException('You are not allowed to read customer');
        }
        return this.findAllProcess(findAllDto).pipe(
            map(
                (data): ApiResponse<PaginatedData<Customer>> => ({
                    status: HttpStatus.OK,
                    data,
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
                        throw new BadRequestException('Customer already deleted');
                    }

                    return from(this.customerRepository.remove(customer));
                }
                if (customer.emails) {
                    throw new BadRequestException('Customer has emails');
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
            throw new ForbiddenException('You are not allowed to delete customer');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: 'Customer removed successfully',
            })),
        );
    }
    restoreProcess(id: string): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                if (!customer.deletedAt) {
                    throw new BadRequestException('Customer already restored');
                }

                return from(this.customerRepository.restore(customer)).pipe(map(() => customer));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Customer | PaginatedData<Customer> | Customer[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Restore, Customer)) {
            throw new ForbiddenException('You are not allowed to restore customer');
        }
        return this.restoreProcess(id).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: 'Customer restored successfully',
            })),
        );
    }
    updateProcess(id: string, updateDto: UpdateCustomerDto): Observable<Customer> {
        const updateData: DeepPartial<Customer> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                if (updateDto.email && updateDto.email !== customer.email) {
                    return from(this.checkExitsByEmail(updateDto.email)).pipe(
                        switchMap((isExist) => {
                            if (isExist) {
                                throw new ConflictException('Email already exists');
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
            throw new ForbiddenException('You are not allowed to update customer');
        }
        return this.updateProcess(id, updateDto).pipe(
            map(() => ({
                status: HttpStatus.OK,
                message: 'Customer updated successfully',
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
