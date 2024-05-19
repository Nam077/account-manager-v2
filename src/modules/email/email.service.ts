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
import { I18nService } from 'nestjs-i18n';
import { I18nContext } from 'nestjs-i18n';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
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
import { CustomerService } from '../customer/customer.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { FindAllEmailDto } from './dto/find-all.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email } from './entities/email.entity';
@Injectable()
export class EmailService
    implements
        CrudService<
            ApiResponse<Email | Email[] | PaginatedData<Email>>,
            Email,
            PaginatedData<Email>,
            CreateEmailDto,
            UpdateEmailDto,
            FindAllEmailDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        @Inject(forwardRef(() => CustomerService))
        private readonly customerService: CustomerService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateEmailDto): Observable<Email> {
        const { email, customerId } = createDto;
        return from(this.customerService.findOneProcess(customerId)).pipe(
            switchMap((customer) => {
                if (!customer) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Customer.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.checkExistByEmailAndCustomerId(email, customerId);
            }),
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.Email.Conflict', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const emailCreate = new Email();
                emailCreate.email = email;
                emailCreate.customerId = customerId;
                const newEmail = this.emailRepository.create(emailCreate);
                return from(this.emailRepository.save(newEmail));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: UserAuth, createDto: CreateEmailDto): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Create, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map(
                (data): ApiResponse<Email> => ({
                    status: HttpStatus.CREATED,
                    message: this.i18nService.translate('message.Email.Created', {
                        lang: I18nContext.current().lang,
                        args: { name: data.email },
                    }),
                    data,
                }),
            ),
        );
    }

    findOneProcess(id: string, options?: FindOneOptionsCustom<Email>, isWithDeleted?: boolean): Observable<Email> {
        return from(this.emailRepository.findOne({ where: { id }, ...options, withDeleted: isWithDeleted }));
    }
    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Email);
        return this.findOneProcess(
            id,
            {
                relations: {
                    customer: true,
                },
            },
            isCanReadWithDeleted,
        ).pipe(
            map((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Found', {
                        lang: I18nContext.current().lang,
                        args: { name: email.email },
                    }),
                    data: email,
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllEmailDto, isWithDeleted?: boolean): Observable<PaginatedData<Email>> {
        const relations = ['customer'];
        const searchFields: SearchField[] = [
            {
                tableName: 'customer',
                fields: ['name', 'email'],
            },
        ];
        const fields: Array<keyof Email> = ['id', 'email'];
        return findWithPaginationAndSearch<Email>(
            this.emailRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }
    findAll(currentUser: UserAuth, findAllDto: FindAllEmailDto): Observable<ApiResponse<PaginatedData<Email>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Email);
        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map(
                (data): ApiResponse<PaginatedData<Email>> => ({
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data,
                }),
            ),
        );
    }

    removeProcess(id: string, hardRemove?: boolean): Observable<Email> {
        return from(
            this.emailRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
                relations: {
                    customer: true,
                },
            }),
        ).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (email.customer.email === email.email) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotDeleted', {
                            lang: I18nContext.current().lang,
                            args: { name: email.email },
                        }),
                    );
                }
                if (hardRemove) {
                    if (!email.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Email.NotDeleted', {
                                lang: I18nContext.current().lang,
                                args: { name: email.email },
                            }),
                        );
                    }
                    return from(this.emailRepository.remove(email));
                }
                return from(this.emailRepository.softRemove(email));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(currentUser: UserAuth, id: string, hardRemove?: boolean): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Delete, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map(
                (data): ApiResponse<Email> => ({
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Deleted', {
                        lang: I18nContext.current().lang,
                        args: { name: data.email },
                    }),
                    data,
                }),
            ),
        );
    }
    removeByCustomerIdProcess(customerId: string, hardRemove?: boolean): Observable<Email[]> {
        return from(this.emailRepository.find({ where: { customerId }, withDeleted: hardRemove })).pipe(
            switchMap((emails) => {
                if (emails.length === 0) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    return from(this.emailRepository.remove(emails));
                }
                return from(this.emailRepository.softRemove(emails));
            }),
        );
    }
    restoreProcess(id: string): Observable<Email> {
        return from(
            this.findOneProcess(
                id,
                {
                    relations: {
                        customer: true,
                    },
                },
                true,
            ),
        ).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (email.customer.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Customer.NotRestored', {
                            lang: I18nContext.current().lang,
                            args: { name: email.customer.name },
                        }),
                    );
                }
                if (!email.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotRestored', {
                            lang: I18nContext.current().lang,
                            args: { name: email.email },
                        }),
                    );
                }
                return from(this.emailRepository.restore(email.id)).pipe(map(() => email));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }

    restoreByCustomerIdProcess(customerId: string) {
        return from(this.emailRepository.find({ where: { customerId }, withDeleted: true })).pipe(
            switchMap((emails) => {
                if (emails.length === 0) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.emailRepository.restore(emails.map((email) => email.id)));
            }),
        );
    }

    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Restore, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map(
                (data): ApiResponse<Email> => ({
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Restored', {
                        lang: I18nContext.current().lang,
                        args: { name: data.email },
                    }),
                    data,
                }),
            ),
        );
    }
    updateProcess(id: string, updateDto: UpdateEmailDto): Observable<Email> {
        const updateData: DeepPartial<Email> = { ...updateDto };
        return from(
            this.findOneProcess(id, {
                relations: {
                    customer: true,
                },
            }),
        ).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const tasks: Observable<any>[] = [];

                if (updateDto.customerId && updateDto.customerId !== email.customerId) {
                    tasks.push(
                        this.customerService.findOneProcess(updateDto.customerId).pipe(
                            tap((customer) => {
                                if (!customer) {
                                    throw new NotFoundException(
                                        this.i18nService.translate('message.Customer.NotFound', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                delete email.customer;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (email.email === email.customer.email) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotUpdated', {
                            lang: I18nContext.current().lang,
                            args: { name: email.email },
                        }),
                    );
                }
                if (
                    (updateDto.customerId && updateDto.customerId !== email.customerId) ||
                    (updateDto.email && updateDto.email !== email.email)
                ) {
                    const checkEmail = updateDto.email || email.email;
                    const checkCustomerId = updateDto.customerId || email.customerId;
                    tasks.push(
                        this.checkExistByEmailAndCustomerId(checkEmail, checkCustomerId).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.Email.Conflict', {
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
                        return updateEntity<Email>(this.emailRepository, email, updateData);
                    }),
                );
            }),
        );
    }
    update(currentUser: UserAuth, id: string, updateDto: UpdateEmailDto): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Update, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.updateProcess(id, updateDto).pipe(
            map(
                (data): ApiResponse<Email> => ({
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Updated', {
                        lang: I18nContext.current().lang,
                        args: { name: data.email },
                    }),
                    data,
                }),
            ),
        );
    }
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

    findEmails(user: UserAuth, id: string) {
        const ability = this.caslAbilityFactory.createForUser(user);
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, Email);
        if (!ability.can(ActionCasl.Read, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findEmailsProcess(user, id, isCanReadWithDeleted).pipe(
            map((emails) => {
                return {
                    status: HttpStatus.OK,
                    message: this.i18nService.translate('message.Email.Found', {
                        lang: I18nContext.current().lang,
                    }),
                    data: emails,
                };
            }),
        );
    }

    findEmailsProcess(user: UserAuth, id: string, isWithDeleted?: boolean): Observable<Email[]> {
        return from(this.emailRepository.find({ where: { customerId: id }, withDeleted: isWithDeleted }));
    }
}
