import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { firstValueFrom, map, Observable } from 'rxjs';

import { User } from '../../modules/user/entities/user.entity';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLE_KEY = 'role';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Role = (role: string) => SetMetadata(ROLE_KEY, role);

export const GetCurrentUser = createParamDecorator(
    async (data: keyof User | undefined, context: ExecutionContext): Promise<User | any> => {
        const user$: Observable<User> = context.switchToHttp().getRequest().user;
        const user = await firstValueFrom(user$.pipe(map((user) => (data ? user && user[data] : user))));
        return user;
    },
);
