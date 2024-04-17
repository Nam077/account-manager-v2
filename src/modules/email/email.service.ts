import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { Email } from './entities/email.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from '../user/entities/user.entity';
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CustomerService } from '../customer/customer.service';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
@Injectable()
export class EmailService
    implements
        CrudService<
            ApiResponse<Email | Email[] | PaginatedData<Email>>,
            CreateEmailDto,
            UpdateEmailDto,
            FindAllDto,
            Email,
            User
        >
{
    constructor(
        @InjectRepository(Email) private readonly emailRepository: Repository<Email>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly customerService: CustomerService,
    ) {}
    findOneByEmailAndCustomerId(email: string, customerId: string): Observable<Email> {
        return from(
            this.emailRepository.findOne({
                where: {
                    email,
                    customerId,
                },
            }),
        );
    }
    checkExistByEmailAndCustomerId(email: string, customerId: string): Observable<boolean> {
        return from(this.emailRepository.existsBy({ email, customerId }));
    }

    create(currentUser: User, createDto: CreateEmailDto): Observable<ApiResponse<Email>> {
        const { email, customerId } = createDto;
        return from(this.customerService.findOneData(customerId)).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException('Customer not found');
                }
                return this.checkExistByEmailAndCustomerId(email, customerId);
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Email already exists');
                }
                const emailCreate = new Email();
                emailCreate.email = email;
                emailCreate.customerId = customerId;
                const newEmail = this.emailRepository.create(emailCreate);
                return from(this.emailRepository.save(newEmail)).pipe(
                    map((email): ApiResponse<Email> => {
                        return {
                            message: 'Email created successfully',
                            data: email,
                            status: HttpStatus.CREATED,
                        };
                    }),
                );
            }),
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<Email | PaginatedData<Email> | Email[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, Email)) {
            throw new ForbiddenException('You are not allowed to read customer');
        }
        const realtions = ['customer'];
        const searchFields: SearchField[] = [
            {
                tableName: 'customer',
                fields: ['name', 'email'],
            },
        ];
        const fields: Array<keyof Email> = ['id', 'email'];
        return findWithPaginationAndSearch<Email>(this.emailRepository, findAllDto, fields, searchFields, realtions);
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Email>> {
        return from(this.emailRepository.findOne({ where: { id } })).pipe(
            map((email) => {
                if (!email) {
                    throw new NotFoundException('Email not found');
                }
                return {
                    data: email,
                    status: HttpStatus.OK,
                };
            }),
        );
    }
    findOneData(id: string): Observable<Email> {
        return from(this.emailRepository.findOne({ where: { id } }));
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateEmailDto,
    ): Observable<ApiResponse<Email | PaginatedData<Email> | Email[]>> {
        const updateData: DeepPartial<Email> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException('Email not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Update, email)) {
                    throw new ForbiddenException('You are not allowed to update email');
                }
                const tasks: Observable<any>[] = [];

                if (updateDto.customerId && updateDto.customerId !== email.customerId) {
                    tasks.push(this.customerService.findOneData(updateDto.customerId));
                } else {
                    tasks.push(of(null));
                }
                if (
                    (updateDto.customerId && updateDto.customerId !== email.customerId) ||
                    (updateDto.email && updateDto.email !== email.email)
                ) {
                    const checkEmail = updateDto.email || email.email;
                    const checkCustomerId = updateDto.customerId || email.customerId;
                    tasks.push(this.checkExistByEmailAndCustomerId(checkEmail, checkCustomerId));
                } else {
                    tasks.push(of(false));
                }
                return forkJoin(tasks).pipe(
                    switchMap(([customer, isExist]) => {
                        if (customer === null && updateDto.customerId && updateDto.customerId !== email.customerId) {
                            throw new NotFoundException('Customer not found');
                        }
                        if (isExist) {
                            throw new ConflictException('Email already exists');
                        }
                        if (customer) {
                            delete email.customer;
                        }
                        return updateEntity<Email>(this.emailRepository, email, updateData);
                    }),
                );
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<Email>> {
        return from(
            this.emailRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
            }),
        ).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException('Email not found');
                }
                if (hardRemove) {
                    if (!email.deletedAt) {
                        throw new BadRequestException('Email not deleted yet');
                    }
                    return from(this.emailRepository.remove(email)).pipe(
                        map(() => {
                            return {
                                message: 'Email deleted successfully',
                                status: HttpStatus.OK,
                            };
                        }),
                    );
                }
                return from(this.emailRepository.softRemove(email)).pipe(
                    map(() => {
                        return {
                            message: 'Email deleted successfully',
                            status: HttpStatus.OK,
                        };
                    }),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Email | PaginatedData<Email> | Email[]>> {
        return from(this.emailRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException('Email not found');
                }
                return from(this.emailRepository.restore(email.id)).pipe(
                    map(() => {
                        return {
                            message: 'Email restored successfully',
                            status: HttpStatus.OK,
                        };
                    }),
                );
            }),
        );
    }
}
