import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import _ from 'lodash';
import { firstValueFrom, map, Observable } from 'rxjs';

import { UserAuth } from '../interface';

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
    async (data: keyof UserAuth | undefined, context: ExecutionContext): Promise<UserAuth | any> => {
        const user$: Observable<UserAuth> = context.switchToHttp().getRequest().user;
        const user = await firstValueFrom(user$.pipe(map((user) => (data ? user && _.get(user, data) : user))));

        return user;
    },
);
