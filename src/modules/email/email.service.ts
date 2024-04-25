import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpStatus,
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
    FindAllDto,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    PaginatedData,
    SearchField,
    updateEntity,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CustomerService } from '../customer/customer.service';
import { User } from '../user/entities/user.entity';
import { CreateEmailDto } from './dto/create-email.dto';
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
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
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
    create(currentUser: User, createDto: CreateEmailDto): Observable<ApiResponse<Email>> {
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

    findOneProcess(id: string, options?: FindOneOptionsCustom<Email>): Observable<Email> {
        return from(this.emailRepository.findOne({ where: { id }, ...options }));
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<Email>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Read, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findOneProcess(id).pipe(
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
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<Email>> {
        const relations = ['customer'];
        const searchFields: SearchField[] = [
            {
                tableName: 'customer',
                fields: ['name', 'email'],
            },
        ];
        const fields: Array<keyof Email> = ['id', 'email'];
        return findWithPaginationAndSearch<Email>(this.emailRepository, findAllDto, fields, searchFields, relations);
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<Email>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, Email)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllProcess(findAllDto).pipe(
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
                if (hardRemove) {
                    if (!email.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.Email.NotDeleted', {
                                lang: I18nContext.current().lang,
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
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<Email>> {
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
                    }),
                    data,
                }),
            ),
        );
    }
    restoreProcess(id: string): Observable<Email> {
        return from(this.emailRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((email) => {
                if (!email) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Email.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!email.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Email.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.emailRepository.restore(email.id)).pipe(map(() => email));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<Email>> {
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
                    }),
                    data,
                }),
            ),
        );
    }
    updateProcess(id: string, updateDto: UpdateEmailDto): Observable<Email> {
        const updateData: DeepPartial<Email> = { ...updateDto };
        return from(this.findOneProcess(id)).pipe(
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
    update(currentUser: User, id: string, updateDto: UpdateEmailDto): Observable<ApiResponse<Email>> {
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
}
