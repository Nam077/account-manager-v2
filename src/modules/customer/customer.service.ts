import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    HttpStatus,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { Customer } from './entities/customer.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { DeepPartial, Repository } from 'typeorm';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class CustomerService
    implements
        CrudService<
            ApiResponse<Customer | Customer | PaginatedData<Customer>>,
            CreateCustomerDto,
            UpdateCustomerDto,
            FindAllDto,
            Customer,
            User
        >
{
    constructor(
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}

    findOneByEmail(email: string): Observable<Customer> {
        return from(
            this.customerRepository.findOne({
                where: { email },
            }),
        );
    }
    create(currentUser: User, createDto: CreateCustomerDto): Observable<ApiResponse<Customer>> {
        const { name, email, address, company, description, phone } = createDto;
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Customer)) {
            throw new ForbiddenException('You are not allowed to create customer');
        }
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
                return from(this.customerRepository.save(customer)).pipe(
                    map(
                        (savedCustomer): ApiResponse<Customer> => ({
                            message: 'Customer created successfully',
                            data: savedCustomer,
                        }),
                    ),
                );
            }),
        );
    }

    checkExitsByEmail(email: string): Observable<boolean> {
        return from(
            this.customerRepository.existsBy({
                email,
            }),
        );
    }

    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<Customer>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, Customer)) {
            throw new ForbiddenException('You are not allowed to read customer');
        }
        const realtions = [];
        const searchFields: SearchField[] = [];
        const fields: Array<keyof Customer> = ['id', 'name', 'email', 'phone', 'address', 'company', 'description'];
        return findWithPaginationAndSearch<Customer>(
            this.customerRepository,
            findAllDto,
            fields,
            searchFields,
            realtions,
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Customer | PaginatedData<Customer>>> {
        return from(this.customerRepository.findOne({ where: { id } })).pipe(
            map((customer): ApiResponse<Customer> => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                return { status: HttpStatus.FOUND, data: customer, message: 'Customer found' };
            }),
        );
    }
    findOneData(id: string): Observable<Customer> {
        return from(this.customerRepository.findOne({ where: { id } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.Manage, Customer)) {
            throw new ForbiddenException('You are not allowed to update customer');
        }
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
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<Customer>> {
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
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Manage, customer)) {
                    throw new ForbiddenException('You are not allowed to delete customer');
                }
                if (hardRemove) {
                    if (!customer.deletedAt) {
                        throw new BadRequestException('Customer already deleted');
                    }

                    return from(this.customerRepository.remove(customer)).pipe(
                        map(
                            (): ApiResponse<Customer> => ({
                                message: 'Customer deleted successfully',
                                data: customer,
                            }),
                        ),
                    );
                }
                if (customer.emails) {
                    throw new BadRequestException('Customer has emails');
                }
                return from(this.customerRepository.softRemove(customer)).pipe(
                    map(
                        (): ApiResponse<Customer> => ({
                            message: 'Customer deleted successfully',
                            data: customer,
                        }),
                    ),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Customer | PaginatedData<Customer>>> {
        return from(this.customerRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Manage, customer)) {
                    throw new ForbiddenException('You are not allowed to restore customer');
                }
                if (!customer.deletedAt) {
                    throw new BadRequestException('Customer already restored');
                }

                return from(this.customerRepository.restore(customer)).pipe(
                    map(
                        (): ApiResponse<Customer> => ({
                            message: 'Customer restored successfully',
                            data: customer,
                            status: HttpStatus.OK,
                        }),
                    ),
                );
            }),
        );
    }
}
