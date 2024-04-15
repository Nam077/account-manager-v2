import {
    BadRequestException,
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllDto } from 'src/dto/find-all.dto';
import { User } from './entities/user.entity';
import { Observable, catchError, from, map, of, switchMap, tap, throwError, forkJoin } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { findWithPaginationAndSearch } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
import { CrudService } from 'src/interfaces/crud.interface';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';

@Injectable()
export class UserService
    implements
        CrudService<
            ApiResponse<User | User | PaginatedData<User>>,
            CreateUserDto,
            UpdateUserDto,
            FindAllDto,
            User,
            User
        >
{
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

    checkExistByEmail(email: string): Observable<boolean> {
        return from(this.userRepository.existsBy({ email }));
    }

    create(currentUser: User, createDto: CreateUserDto): Observable<ApiResponse<User>> {
        const { email, name, password, role } = createDto;
        return from(this.checkExistByEmail(email)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Email already exists');
                }
                return BycryptService.hash(password);
            }),
            switchMap((hash) => {
                const user = new User();
                user.email = email;
                user.name = name;
                user.password = hash;
                user.role = role;
                return this.userRepository.save(user);
            }),
            map((user) => ({ success: true, data: user })),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
        );
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<User>>> {
        const fields = ['id', 'name', 'email', 'role'];
        return findWithPaginationAndSearch<User>(this.userRepository, findAllDto, fields);
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<User>> {
        return from(
            this.userRepository.findOne({
                where: { id },
                select: { password: false },
            }),
        ).pipe(
            map((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                return { success: true, data: user };
            }),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }
    update(currentUser: User, id: string, updateDto: UpdateUserDto): Observable<ApiResponse<User>> {
        const updateData: DeepPartial<User> = { ...updateDto };
        return from(this.findOneData(id)).pipe(
            switchMap((user) => {
                if (!user) {
                    return throwError(() => new NotFoundException('User not found'));
                }
                const tasks: Observable<any>[] = [];
                if (updateDto.email && updateDto.email !== user.email) {
                    tasks.push(
                        this.checkExistByEmail(updateDto.email).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException('Email already exists');
                                }
                            }),
                        ),
                    );
                }
                if (updateDto.password) {
                    tasks.push(
                        BycryptService.hash(updateDto.password).pipe(tap((hash) => (updateData.password = hash))),
                    );
                }
                if (tasks.length > 0) {
                    return forkJoin(tasks).pipe(map(() => user));
                }
                return of(user);
            }),
            switchMap((user) => updateEntity<User>(this.userRepository, user, updateData)),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST))),
        );
    }

    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<User>> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (hardRemove && !user.deletedAt) {
                    throw new BadRequestException('User not deleted yet');
                }
                return hardRemove ? from(this.userRepository.remove(user)) : from(this.userRepository.softRemove(user));
            }),
            map(() => ({ success: true, message: `User ${hardRemove ? 'permanently ' : ''}removed` })),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }

    restore(currentUser: User, id: string): Observable<ApiResponse<User | PaginatedData<User>>> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (!user.deletedAt) {
                    throw new BadRequestException('User not deleted yet');
                }
                return from(this.userRepository.restore(user));
            }),
            map(() => ({ success: true, message: 'User restored' })),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }
    findOneData(id: string): Observable<User> {
        return from(
            this.userRepository.findOne({
                where: { id },
            }),
        );
    }
}
