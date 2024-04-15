import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { of } from 'rxjs';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLE_KEY = 'role';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Role = (role: string) => SetMetadata(ROLE_KEY, role);

export const GetCurrentUser = createParamDecorator((data: string | undefined, context: ExecutionContext) => {
    return of({
        id: '1',
        name: 'John Doe',
    });
});
