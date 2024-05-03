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
import { I18nContext, I18nService } from 'nestjs-i18n';
import { catchError, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

import {
    ActionCasl,
    ApiResponse,
    BcryptServiceInstance,
    CrudService,
    FindOneOptionsCustom,
    findWithPaginationAndSearch,
    JwtPayload,
    PaginatedData,
    SearchField,
    updateEntity,
    UserRole,
} from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { LoginDto } from '../auth/dto/login.dto';
import { CaslAbilityFactory } from '../casl/casl-ability-factory';
import { CreateUserDto } from './dto/create-user.dto';
import { FindAllUserDto } from './dto/find-all.dto';
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
            FindAllUserDto,
            User
        >
{
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly caslAbilityFactory: CaslAbilityFactory,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    createProcess(createDto: CreateUserDto): Observable<User> {
        const { email, name, password, role } = createDto;
        return from(this.checkExistByEmail(email)).pipe(
            switchMap((isExist) => {
                if (isExist) {
                    throw new ConflictException(
                        this.i18nService.translate('message.User.Conflict', {
                            args: { name: email },
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return BcryptServiceInstance.hash(password);
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
    create(currentUser: User, createDto: CreateUserDto): Observable<ApiResponse<User>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.Manage, User)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const { role } = currentUser;
        if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
            if (!ability.can(ActionCasl.AddAdmin, User)) {
                throw new ForbiddenException(
                    this.i18nService.translate('message.Authentication.Forbidden', {
                        lang: I18nContext.current().lang,
                    }),
                );
            }
        }
        return this.createProcess(createDto).pipe(
            map((user) => {
                return {
                    status: HttpStatus.CREATED,
                    data: user,
                    message: this.i18nService.translate('message.User.Created', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findOneProcess(id: string, options?: FindOneOptionsCustom<User>, isWithDeleted?: boolean): Observable<User> {
        return from(
            this.userRepository.findOne({
                where: { id },
                ...options,
                withDeleted: isWithDeleted,
            }),
        );
    }
    findOne(currentUser: User, id: string): Observable<ApiResponse<User>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, User);
        return this.findOneProcess(id, {}, isCanReadWithDeleted).pipe(
            map((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!ability.can(ActionCasl.Read, user)) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.Authentication.Forbidden', {
                            lang: I18nContext.current().lang,
                            args: { name: user.name },
                        }),
                    );
                }
                return {
                    status: HttpStatus.OK,
                    data: user,
                    message: this.i18nService.translate('message.User.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    findAllProcess(findAllDto: FindAllUserDto, isWithDeleted?: boolean): Observable<PaginatedData<User>> {
        const fields: Array<keyof User> = ['id', 'name', 'email', 'role'];
        const relations: string[] = [];
        const searchFields: SearchField[] = [];
        return findWithPaginationAndSearch<User>(
            this.userRepository,
            findAllDto,
            fields,
            isWithDeleted,
            relations,
            searchFields,
        );
    }
    findAll(currentUser: User, findAllDto: FindAllUserDto): Observable<ApiResponse<PaginatedData<User>>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        if (!ability.can(ActionCasl.ReadAll, User)) {
            throw new ForbiddenException(
                this.i18nService.translate('message.Authentication.Forbidden', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        const isCanReadWithDeleted = ability.can(ActionCasl.ReadWithDeleted, User);
        return this.findAllProcess(findAllDto, isCanReadWithDeleted).pipe(
            map((data) => {
                return {
                    status: HttpStatus.OK,
                    data,
                    message: this.i18nService.translate('message.User.Found', {
                        lang: I18nContext.current().lang,
                    }),
                };
            }),
        );
    }
    removeProcess(id: string, hardRemove?: boolean): Observable<User> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: hardRemove })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (hardRemove) {
                    if (!user.deletedAt) {
                        throw new BadRequestException(
                            this.i18nService.translate('message.User.NotDeleted', {
                                lang: I18nContext.current().lang,
                            }),
                        );
                    }
                    return this.userRepository.remove(user);
                }
                return this.userRepository.softRemove(user);
            }),
            catchError((error) => throwError(() => new HttpException(error.message, HttpStatus.NOT_FOUND))),
        );
    }
    remove(currentUser: User, id: string, hardRemove?: boolean): Observable<ApiResponse<User>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        return this.findOneProcess(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!ability.can(ActionCasl.Delete, user)) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.Authentication.Forbidden', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.removeProcess(id, hardRemove).pipe(
                    map((data) => {
                        return {
                            status: HttpStatus.OK,
                            data,
                            message: this.i18nService.translate('message.User.Deleted', {
                                lang: I18nContext.current().lang,
                            }),
                        };
                    }),
                );
            }),
        );
    }
    restoreProcess(id: string): Observable<User> {
        return from(this.userRepository.findOne({ where: { id }, withDeleted: true })).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!user.deletedAt) {
                    throw new BadRequestException(
                        this.i18nService.translate('message.User.NotRestored', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return from(this.userRepository.restore(user.id)).pipe(map(() => user));
            }),
            catchError((error) => throwError(() => new BadRequestException(error.message))),
        );
    }
    restore(currentUser: User, id: string): Observable<ApiResponse<User>> {
        const ability = this.caslAbilityFactory.createForUser(currentUser);
        return this.findOneProcess(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                if (!ability.can(ActionCasl.Restore, user)) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.Authentication.Forbidden', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.restoreProcess(id).pipe(
                    map((data) => {
                        return {
                            status: HttpStatus.OK,
                            data,
                            message: this.i18nService.translate('message.User.Restored', {
                                lang: I18nContext.current().lang,
                            }),
                        };
                    }),
                );
            }),
        );
    }
    updateProcess(id: string, updateDto: UpdateUserDto): Observable<User> {
        const updateData: DeepPartial<User> = { ...updateDto };
        return from(this.findOneProcess(id)).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                const tasks: Observable<any>[] = [];
                if (updateDto.email && updateDto.email !== user.email) {
                    tasks.push(
                        this.checkExistByEmail(updateDto.email).pipe(
                            tap((isExist) => {
                                if (isExist) {
                                    throw new ConflictException(
                                        this.i18nService.translate('message.User.Conflict', {
                                            args: { name: updateDto.email },
                                            lang: I18nContext.current().lang,
                                        }),
                                    );
                                }
                            }),
                        ),
                    );
                } else tasks.push(of(null));
                if (updateDto.password) {
                    tasks.push(
                        BcryptServiceInstance.hash(updateDto.password).pipe(
                            tap((hash) => (updateData.password = hash)),
                        ),
                    );
                } else tasks.push(of(null));
                return forkJoin(tasks).pipe(switchMap(() => updateEntity<User>(this.userRepository, user, updateData)));
            }),
        );
    }
    update(currentUser: User, id: string, updateDto: UpdateUserDto): Observable<ApiResponse<User>> {
        return this.findOneProcess(id).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException(
                        this.i18nService.translate('message.User.NotFound', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                const ability = this.caslAbilityFactory.createForUser(currentUser);
                if (!ability.can(ActionCasl.Update, user)) {
                    throw new ForbiddenException(
                        this.i18nService.translate('message.Authentication.Forbidden', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return this.updateProcess(id, updateDto).pipe(
                    map((data) => {
                        return {
                            status: HttpStatus.OK,
                            data,
                            message: this.i18nService.translate('message.User.Updated', {
                                lang: I18nContext.current().lang,
                            }),
                        };
                    }),
                );
            }),
        );
    }

    checkExistByEmail(email: string): Observable<boolean> {
        return from(this.userRepository.existsBy({ email }));
    }

    validateUser(payload: JwtPayload): Observable<User> {
        return from(this.findOneProcess(payload.sub));
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
                    throw new UnauthorizedException(
                        this.i18nService.translate('message.Login.Failed', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }
                return BcryptServiceInstance.compare(loginDto.password, user.password).pipe(
                    switchMap((isMatch) => {
                        if (!isMatch) {
                            throw new UnauthorizedException(
                                this.i18nService.translate('message.Login.Failed', {
                                    lang: I18nContext.current().lang,
                                }),
                            );
                        }
                        delete user.password;
                        return of(user);
                    }),
                );
            }),
        );
    }
}
