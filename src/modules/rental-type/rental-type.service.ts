import { CaslAbilityFactory } from './../casl/casl-ability-factory';
import { ConflictException, HttpStatus, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRentalTypeDto } from './dto/create-rental-type.dto';
import { UpdateRentalTypeDto } from './dto/update-rental-type.dto';
import { CrudService } from 'src/interfaces/crud.interface';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { User } from '../user/entities/user.entity';
import { RentalType } from './entities/rental-type.entity';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { slugifyString } from 'src/helper/slug';
import { SearchField, findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';

@Injectable()
export class RentalTypeService
    implements
        CrudService<
            ApiResponse<RentalType | RentalType[] | PaginatedData<RentalType>>,
            CreateRentalTypeDto,
            UpdateRentalTypeDto,
            FindAllDto,
            RentalType,
            User
        >
{
    constructor(
        @InjectRepository(RentalType)
        private readonly rentalTypeRepository: Repository<RentalType>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}

    checkExistBySlug(slug: string): Observable<boolean> {
        return from(this.rentalTypeRepository.existsBy({ slug }));
    }
    create(currentUser: User, createDto: CreateRentalTypeDto): Observable<ApiResponse<RentalType>> {
        const { name, maxSlots, description } = createDto;
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
                return from(this.rentalTypeRepository.save(rentalTypeCreated)).pipe(
                    map(
                        (data): ApiResponse<RentalType> => ({
                            status: HttpStatus.CREATED,
                            message: 'Rental type created successfully',
                            data,
                        }),
                    ),
                );
            }),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<RentalType>>> {
        const fields = ['id', 'name', 'maxSlots', 'description'];
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
    findOne(currentUser: User, id: string): Observable<ApiResponse<RentalType>> {
        return from(
            this.rentalTypeRepository.findOne({
                where: { id },
            }),
        ).pipe(
            map((rentalType: RentalType): ApiResponse<RentalType> => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                return {
                    status: HttpStatus.OK,
                    message: 'Rental type found',
                    data: rentalType,
                };
            }),
        );
    }
    findOneData(id: string): Observable<RentalType> {
        return from(this.rentalTypeRepository.findOne({ where: { id } }));
    }
    update(currentUser: User, id: string, updateDto: UpdateRentalTypeDto): Observable<ApiResponse<RentalType>> {
        const updateData: DeepPartial<RentalType> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                if (updateDto.name && rentalType.name !== updateDto.name) {
                    const slug = slugifyString(updateDto.name);
                    return from(this.checkExistBySlug(slug)).pipe(
                        switchMap((exist) => {
                            if (exist) {
                                throw new ConflictException('Rental type already exists');
                            }
                            updateData.slug = slug;
                            return of(rentalType);
                        }),
                    );
                } else return of(rentalType);
            }),
            switchMap((rentalType: RentalType) => {
                return updateEntity<RentalType>(this.rentalTypeRepository, rentalType, updateData);
            }),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<RentalType>> {
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
                    return from(this.rentalTypeRepository.remove(rentalType)).pipe(
                        map(() => ({
                            status: HttpStatus.OK,
                            message: 'Rental type removed successfully',
                        })),
                    );
                }

                return from(this.rentalTypeRepository.softRemove(rentalType)).pipe(
                    map(() => ({
                        status: HttpStatus.OK,
                        message: 'Rental type removed successfully',
                    })),
                );
            }),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<RentalType>> {
        return from(this.rentalTypeRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((rentalType: RentalType) => {
                if (!rentalType) {
                    throw new NotFoundException('Rental type not found');
                }
                if (!rentalType.deletedAt) {
                    throw new BadRequestException('Rental type not deleted');
                }
                return from(this.rentalTypeRepository.restore(rentalType.id)).pipe(
                    map(() => ({
                        status: HttpStatus.OK,
                        message: 'Rental type restored successfully',
                    })),
                );
            }),
        );
    }
}
