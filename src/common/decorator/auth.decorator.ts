import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { firstValueFrom, map, Observable } from 'rxjs';

import { User } from '../../modules/user/entities/user.entity';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLE_KEY = 'role';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
/**
 * Decorator function that sets the metadata for the role of a user.
 * @param role - The role of the user.
 */
export const Role = (role: string) => SetMetadata(ROLE_KEY, role);

/**
 * Custom decorator to get the current user.
 * @param data - Optional property of the User object to retrieve.
 * @param context - The execution context.
 * @returns A Promise that resolves to the User object or any value.
 */
export const GetCurrentUser = createParamDecorator(
    async (data: keyof User | undefined, context: ExecutionContext): Promise<User | any> => {
        const user$: Observable<User> = context.switchToHttp().getRequest().user;
        const user = await firstValueFrom(user$.pipe(map((user) => (data ? user && user[data] : user))));
        return user;
    },
);
