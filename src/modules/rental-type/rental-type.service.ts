import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
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
    slugifyString,
    updateEntity,
    UserAuth,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateRentalTypeDto } from './dto/create-rental-type.dto';
import { FindAllRentalTypeDto } from './dto/find-all.dto';
import { UpdateRentalTypeDto } from './dto/update-rental-type.dto';
import { RentalType } from './entities/rental-type.entity';

@Injectable()
export class RentalTypeService
    implements
        CrudService<
            ApiResponse<RentalType | RentalType[] | PaginatedData<RentalType>>,
            RentalType,
            PaginatedData<RentalType>,
            CreateRentalTypeDto,
            UpdateRentalTypeDto,
            FindAllRentalTypeDto,
            UserAuth
        >
{
    constructor(
        @InjectRepository(RentalType)
        private readonly rentalTypeRepository: Repository<RentalType>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateRentalTypeDto): Observable<RentalType> {
        const { name, maxSlots, description, isWorkspace } = createDto;
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((exist) => {
                if (exist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.Rental.Conflict', {
                            args: { name },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const rentalType = new RentalType();
                rentalType.name = name;
                rentalType.maxSlots = maxSlots;
                rentalType.description = description;
                rentalType.slug = slug;
                rentalType.isWorkspace = isWorkspace;
                const rentalTypeCreated = this.rentalTypeRepository.create(rentalType);
                return from(this.rentalTypeRepository.save(rentalTypeCreated));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: UserAuth, createDto: CreateRentalTypeDto): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Create, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.createProcess(createDto).pipe(
            map((rentalType) => {
                return {
                    status: HttpStatus.CREATED,
                    data: rentalType,
                    message: this.i18nService.translate('message.Rental.Created', {
                        args: { name: rentalType.name },
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    findOneProcess(
        id: string,
        options?: FindOneOptionsCustom<RentalType>,
        isWithDeleted?: boolean,
    ): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id }, ...options, withDeleted: isWithDeleted }));
    }
    findOne(currentUser: UserAuth, id: string): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Read, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, RentalType);
        return this.findOneProcess(id, {}, isCanReadWithDeleted).pipe(
            map((rentalType) => {
                if (!rentalType) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    data: rentalType,
                    message: this.i18nService.translate('message.Rental.Found', {
                        args: { name: rentalType.name },
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllRentalTypeDto, isWithDeleted?: boolean): Observable<PaginatedData<RentalType>> {
        const fields: Array<keyof RentalType> = ['id', 'name', 'maxSlots', 'description'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<RentalType>(
            this.rentalTypeRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }
    findAll(
        currentUser: UserAuth,
        findAllDto: FindAllRentalTypeDto,
    ): Observable<ApiResponse<PaginatedData<RentalType>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.ReadAll, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, RentalType);
        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((rentalTypes) => {
                return {
                    status: HttpStatus.OK,
                    data: rentalTypes,
                    message: this.i18nService.translate('message.Rental.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<RentalType> {
        return from(
            this.rentalTypeRepository.findOne({
                where: { id },
                withDeleted: hardRemove,
            }),
        ).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!rentalType.deletedAt) {
                        throw new NotFoundException(
                            this.i18nService.translate('message.Rental.NotFound', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return from(this.rentalTypeRepository.remove(rentalType));
                }

                return from(this.rentalTypeRepository.softRemove(rentalType));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(currentUser: UserAuth, id: string, hardRemove?: boolean): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Delete, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((rentalType) => {
                return {
                    status: HttpStatus.OK,
                    data: rentalType,
                    message: this.i18nService.translate('message.Rental.Deleted', {
                        args: { name: rentalType.name },
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    restoreProcess(id: string): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!rentalType.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.Rental.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.rentalTypeRepository.restore(rentalType.id)).pipe(map(() => rentalType));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: UserAuth, id: string): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Restore, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.restoreProcess(id).pipe(
            map((rentalType) => {
                return {
                    status: HttpStatus.OK,
                    data: rentalType,
                    message: this.i18nService.translate('message.Rental.Restored', {
                        args: { name: rentalType.name },
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateRentalTypeDto): Observable<RentalType> {
        const updateData: DeepPartial<RentalType> = { ...updateDto };
        return this.findOneProcess(id).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.Rental.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const tasks: Observable<any>[] = [];
                if (updateData.name && rentalType.name !== updateData.name) {
                    const slug = slugifyString(updateData.name);
                    tasks.push(
                        this.checkExistBySlug(slug).pipe(
                            tap((exist) => {
                                if (exist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.Rental.Conflict', {
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                                updateData.slug = slug;
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                return forkJoin(tasks).pipe(
                    switchMap(() => {
                        return updateEntity<RentalType>(this.rentalTypeRepository, rentalType, updateData);
                    }),
                );
            }),
        );
    }
    update(currentUser: UserAuth, id: string, updateDto: UpdateRentalTypeDto): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(ActionCasl.Update, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.updateProcess(id, updateDto).pipe(
            map((rentalType) => {
                return {
                    status: HttpStatus.OK,
                    data: rentalType,
                    message: this.i18nService.translate('message.Rental.Updated', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.rentalTypeRepository.existsBy({ slug }));
    }

    findAllData(user: UserAuth) {
        const ability = this.caslAbilityFactory.createForUser(user);
        if (ability.cannot(ActionCasl.ReadAll, RentalType)) {
            throw new BadRequestException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.findAllDataProcess();
    }

    findAllDataProcess() {
        return from(this.rentalTypeRepository.find());
    }
}
