import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import { FindAllDto } from '../../dto/find-all.dto';
import { findWithPaginationAndSearch, SearchField } from '../../helper/pagination';
import { slugifyString } from '../../helper/slug';
import { updateEntity } from '../../helper/update';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { CrudService } from '../../interfaces/crud.interface';
import { User } from '../user/entities/user.entity';
import { Action, CaslAbilityFactory } from './../casl/casl-ability-factory';
import { CreateRentalTypeDto } from './dto/create-rental-type.dto';
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
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(RentalType)
        private readonly rentalTypeRepository: Repository<RentalType>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}
    createProcess(createDto: CreateRentalTypeDto): Observable<RentalType> {
        const { name, maxSlots, description } = createDto;
        console.log('name', name);
        const slug = slugifyString(name);
        return from(this.checkExistBySlug(slug)).pipe(
            switchMap((exist) => {
                if (exist) {
                    throw new ConflictException('Rental type already exists');
                }
                const rentalType = new RentalType();
                rentalType.name = name;
                rentalType.maxSlots = maxSlots;
                rentalType.description = description;
                rentalType.slug = slug;
                const rentalTypeCreated = this.rentalTypeRepository.create(rentalType);
                return from(this.rentalTypeRepository.save(rentalTypeCreated));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateRentalTypeDto): Observable<ApiResponse<RentalType>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Create, RentalType)) {
            throw new BadRequestException('You do not have permission to create a rental type');
        }
        return this.createProcess(createDto).pipe(
            map((rentalType) => {
                return { status: HttpStatus.CREATED, data: rentalType, message: 'Rental type created successfully' };
            }),
        );
    }
    findOneData(id: string): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id } }));
    }
    findOneProcess(id: string): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id } })).pipe(
            map((rentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                return rentalType;
            }),
        );
    }
    findOne(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<RentalType | PaginatedData<RentalType> | RentalType[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Read, RentalType)) {
            throw new BadRequestException('You do not have permission to read a rental type');
        }
        return this.findOneProcess(id).pipe(
            map((rentalType) => {
                return { status: HttpStatus.OK, data: rentalType, message: 'Rental type found' };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<RentalType>> {
        const fields: Array<keyof RentalType> = ['id', 'name', 'maxSlots', 'description'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<RentalType>(
            this.rentalTypeRepository,
            findAllDto,
            fields,
            searchFields,
            relations,
        );
    }
    findAll(
        currentUser: User,
        findAllDto: FindAllDto,
    ): Observable<ApiResponse<RentalType | PaginatedData<RentalType> | RentalType[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.ReadAll, RentalType)) {
            throw new BadRequestException('You do not have permission to read all rental types');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((rentalTypes) => {
                return { status: HttpStatus.OK, data: rentalTypes, message: 'Rental types found' };
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
                    throw new NotFoundException('Rental type not found');
                }
                if (hardRemove) {
                    if (!rentalType.deletedAt) {
                        throw new NotFoundException('Rental type not found');
                    }
                    return from(this.rentalTypeRepository.remove(rentalType));
                }

                return from(this.rentalTypeRepository.softRemove(rentalType));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<RentalType | PaginatedData<RentalType> | RentalType[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Delete, RentalType)) {
            throw new BadRequestException('You do not have permission to delete a rental type');
        }
        return this.removeProcess(id, hardRemove).pipe(
            map((rentalType) => {
                return {
                    status: HttpStatus.OK,
                    data: rentalType,
                    message: `Rental type ${hardRemove ? 'hard deleted' : 'soft deleted'} successfully`,
                };
            }),
        );
    }
    restoreProcess(id: string): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                if (!rentalType.deletedAt) {
                    throw new BadRequestException('Rental type not deleted');
                }
                return from(this.rentalTypeRepository.restore(rentalType.id)).pipe(map(() => rentalType));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(
        currentUser: User,
        id: string,
    ): Observable<ApiResponse<RentalType | PaginatedData<RentalType> | RentalType[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Restore, RentalType)) {
            throw new BadRequestException('You do not have permission to restore a rental type');
        }
        return this.restoreProcess(id).pipe(
            map((rentalType) => {
                return { status: HttpStatus.OK, data: rentalType, message: 'Rental type restored successfully' };
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateRentalTypeDto): Observable<RentalType> {
        const updateData: DeepPartial<RentalType> = { ...updateDto };
        return this.findOneData(id).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                const tasks: Observable<any>[] = [];
                if (updateData.name && rentalType.name !== updateData.name) {
                    const slug = slugifyString(updateData.name);
                    tasks.push(
                        this.checkExistBySlug(slug).pipe(
                            tap((exist) => {
                                if (exist) {
                                    throw new ConflictException('Rental type already exists');
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
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateRentalTypeDto,
    ): Observable<ApiResponse<RentalType | PaginatedData<RentalType> | RentalType[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (ability.cannot(Action.Update, RentalType)) {
            throw new BadRequestException('You do not have permission to update a rental type');
        }
        return this.updateProcess(id, updateDto).pipe(
            map((rentalType) => {
                return { status: HttpStatus.OK, data: rentalType, message: 'Rental type updated successfully' };
            }),
        );
    }

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.rentalTypeRepository.existsBy({ slug }));
    }
}
