import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable, of } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/common/decorator/auth.decorator';

@Injectable()
export class AuthJwtGuard extends AuthGuard('auth-strategy') implements CanActivate {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): Observable<boolean> {
        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
        if (isPublic) {
            return of(true);
        }
        const rs = super.canActivate(context) as Observable<boolean>;
        return rs;
    }
}
