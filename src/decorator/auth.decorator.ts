import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { map, Observable, of } from 'rxjs';
import { User } from '../modules/user/entities/user.entity';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLE_KEY = 'role';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Role = (role: string) => SetMetadata(ROLE_KEY, role);

export const GetCurrentUser = createParamDecorator((data: string | undefined, context: ExecutionContext) => {
    const user: Observable<User> = context.switchToHttp().getRequest().user;
    return user.pipe(map((user) => (data ? user && user[data] : user)));
});
