import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { FindAllDto } from 'src/dto/find-all.dto';
import BcryptService from 'src/helper/hash';
import { findWithPaginationAndSearch, SearchField } from 'src/helper/pagination';
import { updateEntity } from 'src/helper/update';
import { ApiResponse, PaginatedData } from 'src/interfaces/api-response.interface';
import { CrudService } from 'src/interfaces/crud.interface';
import { DeepPartial, Repository } from 'typeorm';

import { LoginDto } from '../auth/dto/login.dto';
import { JwtPayload } from '../auth/strategies/auth-strategy/auth-strategy';
import { Action, CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
@Injectable()
export class UserService
    implements
        CrudService<
            ApiResponse<User | User[] | PaginatedData<User>>,
            User,
            PaginatedData<User>,
            CreateUserDto,
            UpdateUserDto,
            FindAllDto,
            User
        >
{
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {}
    createProcess(createDto: CreateUserDto): Observable<User> {
        const { email, name, password, role } = createDto;
        return from(this.checkExistByEmail(email)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException('Email already exists');
                }
                return BcryptService.hash(password);
            }),
            switchMap((hash) => {
                const user = new User();
                user.email = email;
                user.name = name;
                user.password = hash;
                user.role = role;
                return this.userRepository.save(user);
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    create(currentUser: User, createDto: CreateUserDto): Observable<ApiResponse<User | PaginatedData<User> | User[]>> {
        // const ability = this.caslAbilityFactory.createForUser(currentUser);
        // if (!ability.can(Action.Manage, User)) {
        //     throw new ForbiddenException('You are not allowed to create user');
        // }
        // const { role } = currentUser;
        // if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
        //     if (!ability.can(Action.AddAdmin, User)) {
        //         throw new ForbiddenException('You are not allowed to add admin');
        //     }
        // }
        return this.createProcess(createDto).pipe(
            map((user) => {
                return { status: HttpStatus.CREATED, data: user };
            }),
        );
    }
    findOneProcess(id: string): Observable<User> {
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
                return user;
            }),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<User | PaginatedData<User> | User[]>> {
        return this.findOneProcess(id).pipe(
            map((user) => {
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Read, user)) {
                    throw new ForbiddenException('You are not allowed to read this user');
                }
                return { status: HttpStatus.OK, data: user };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllDto): Observable<PaginatedData<User>> {
        const fields: Array<keyof User> = ['id', 'name', 'email', 'role'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<User>(this.userRepository, findAllDto, fields, searchFields, relations);
    }
    findAll(currentUser: User, findAllDto: FindAllDto): Observable<ApiResponse<PaginatedData<User>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(Action.ReadAll, User)) {
            throw new ForbiddenException('You are not allowed to read users');
        }
        return this.findAllProcess(findAllDto).pipe(
            map((data) => {
                return { status: HttpStatus.OK, data, message: 'Users fetched successfully' };
            }),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<User> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (hardRemove && !user.deletedAt) {
                    throw new BadRequestException('User not deleted yet');
                    return this.userRepository.remove(user);
                }
                return this.userRepository.softRemove(user);
            }),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }
    remove(
        currentUser: User,
        id: string,
        hardRemove?: boolean,
    ): Observable<ApiResponse<User | PaginatedData<User> | User[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        return this.findOneData(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (!ability.can(Action.Delete, user)) {
                    throw new ForbiddenException('You are not allowed to delete this user');
                }
                return this.removeProcess(id, hardRemove).pipe(
                    map((data) => {
                        return { status: HttpStatus.OK, data, message: 'User deleted successfully' };
                    }),
                );
            }),
        );
    }
    restoreProcess(id: string): Observable<User> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (!user.deletedAt) {
                    throw new BadRequestException('User not deleted yet');
                }
                return from(this.userRepository.restore(user.id)).pipe(map(() => user));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<User | PaginatedData<User> | User[]>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        return this.findOneData(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                if (!ability.can(Action.Restore, user)) {
                    throw new ForbiddenException('You are not allowed to restore this user');
                }
                return this.restoreProcess(id).pipe(
                    map((data) => {
                        return { status: HttpStatus.OK, data, message: 'User restored successfully' };
                    }),
                );
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateUserDto): Observable<User> {
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
                } else tasks.push(of(null));
                if (updateDto.password) {
                    tasks.push(
                        BcryptService.hash(updateDto.password).pipe(tap((hash) => (updateData.password = hash))),
                    );
                } else tasks.push(of(null));
                return forkJoin(tasks).pipe(switchMap(() => updateEntity<User>(this.userRepository, user, updateData)));
            }),
        );
    }
    update(
        currentUser: User,
        id: string,
        updateDto: UpdateUserDto,
    ): Observable<ApiResponse<User | PaginatedData<User> | User[]>> {
        return this.findOneData(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(Action.Update, user)) {
                    throw new ForbiddenException('You are not allowed to update this user');
                }
                return this.updateProcess(id, updateDto).pipe(
                    map((data) => {
                        return { status: HttpStatus.OK, data, message: 'User updated successfully' };
                    }),
                );
            }),
        );
    }

    checkExistByEmail(email: string): Observable<boolean> {
        return from(this.userRepository.existsBy({ email }));
    }

    findOneData(id: string): Observable<User> {
        return from(
            this.userRepository.findOne({
                where: { id },
            }),
        );
    }
    validateUser(payload: JwtPayload): Observable<User> {
        return from(this.userRepository.findOne({ where: { id: payload.sub } }));
    }

    login(loginDto: LoginDto) {
        return from(
            this.userRepository.findOne({
                where: { email: loginDto.email },
                select: { password: true, email: true, id: true },
            }),
        ).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new UnauthorizedException('Invalid credentials');
                }
                return BcryptService.compare(loginDto.password, user.password).pipe(
                    switchMap((isMatch) => {
                        if (!isMatch) {
                            throw new UnauthorizedException('Invalid credentials');
                        }
                        delete user.password;
                        return of(user);
                    }),
                );
            }),
        );
    }
}
